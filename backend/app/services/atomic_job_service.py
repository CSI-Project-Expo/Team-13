from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID
import logging

from app.models.job import Job, JobStatus
from app.services.notification_service import NotificationService
from app.services.wallet_service import WalletService
from app.utils.exceptions import JobNotFoundError, InvalidJobTransitionError, JobAlreadyAssignedError

logger = logging.getLogger(__name__)


class AtomicJobService:
    """Service for atomic job operations with proper locking"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def accept_job_atomically(self, job_id: UUID, genie_id: UUID) -> Job:
        """
        Atomically accept a job using database transaction with row locking.
        This prevents race conditions where multiple genies try to accept the same job.
        """
        try:
            # Lock the job row for update to prevent concurrent modifications
            result = await self.db.execute(
                select(Job).where(Job.id == job_id).with_for_update()
            )
            job = result.scalar_one_or_none()
            
            if not job:
                raise JobNotFoundError(f"Job {job_id} not found")
            
            # Validate job status
            if job.status != JobStatus.POSTED:
                raise InvalidJobTransitionError(
                    f"Job {job_id} is not in POSTED status. Current status: {job.status}"
                )
            
            # Check if job is already assigned
            if job.assigned_genie is not None:
                raise JobAlreadyAssignedError(f"Job {job_id} is already assigned")
            
            # Update job atomically
            job.assigned_genie = genie_id
            job.status = JobStatus.ACCEPTED
            
            await self.db.commit()
            await self.db.refresh(job)
            
            logger.info(f"Genie {genie_id} accepted job {job_id} atomically")
            return job
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to accept job {job_id} atomically: {e}")
            raise
    
    async def start_job_atomically(self, job_id: UUID, genie_id: UUID) -> Job:
        """
        Atomically start a job using database transaction with row locking.
        """
        try:
            # Lock the job row
            result = await self.db.execute(
                select(Job).where(Job.id == job_id).with_for_update()
            )
            job = result.scalar_one_or_none()
            
            if not job:
                raise JobNotFoundError(f"Job {job_id} not found")
            
            # Validate job status and assignment
            if job.status != JobStatus.ACCEPTED:
                raise InvalidJobTransitionError(
                    f"Job {job_id} is not in ACCEPTED status. Current status: {job.status}"
                )
            
            if job.assigned_genie != genie_id:
                raise JobNotFoundError("Access denied")
            
            # Update job status
            job.status = JobStatus.IN_PROGRESS
            
            # Set start timestamp
            from datetime import datetime, timezone
            job.started_at = datetime.now(timezone.utc)
            
            await self.db.commit()
            await self.db.refresh(job)
            
            # Notify job owner
            try:
                notification_service = NotificationService(self.db)
                await notification_service.create_notification(
                    user_id=job.user_id,
                    title="Your job has started",
                    message=f"A Genie has started working on your job '{job.title}'."
                )
                await self.db.commit()
            except Exception as notification_error:
                await self.db.rollback()
                logger.warning(
                    f"Job {job_id} start succeeded but owner notification failed: {notification_error}"
                )
            
            logger.info(f"Genie {genie_id} started job {job_id} atomically")
            return job
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to start job {job_id} atomically: {e}")
            raise
    
    async def complete_job_atomically(self, job_id: UUID, genie_id: UUID) -> Job:
        """
        Atomically complete a job using database transaction with row locking.
        """
        try:
            result = await self.db.execute(
                select(Job).where(Job.id == job_id).with_for_update()
            )
            job = result.scalar_one_or_none()
            
            if not job:
                raise JobNotFoundError(f"Job {job_id} not found")
            
            # Validate job status and assignment
            if job.status != JobStatus.IN_PROGRESS:
                raise InvalidJobTransitionError(
                    f"Job {job_id} is not in IN_PROGRESS status. Current status: {job.status}"
                )
            
            if job.assigned_genie != genie_id:
                raise JobAlreadyAssignedError(
                    f"Job {job_id} is not assigned to genie {genie_id}"
                )

            if job.price is None or job.price <= 0:
                raise InvalidJobTransitionError(
                    f"Job {job_id} has invalid price for payout"
                )
            
            # Update status
            job.status = JobStatus.COMPLETED
            
            # Set completion timestamp
            from datetime import datetime, timezone
            job.completed_at = datetime.now(timezone.utc)

            # Release escrow to genie as part of completion flow
            wallet_service = WalletService(self.db)
            await wallet_service.transfer_escrow_to_genie_atomically(
                from_user_id=job.user_id,
                to_genie_id=genie_id,
                amount=job.price
            )

            await self.db.refresh(job)
            
            # Notify job owner
            try:
                notification_service = NotificationService(self.db)
                await notification_service.create_notification(
                    user_id=job.user_id,
                    title="Job completed and payment released",
                    message=f"Your job '{job.title}' is complete. ₹{job.price} has been released from escrow to the Genie."
                )
                await self.db.commit()
            except Exception as notification_error:
                await self.db.rollback()
                logger.warning(
                    f"Job {job_id} completion succeeded but owner notification failed: {notification_error}"
                )
            
            logger.info(f"Genie {genie_id} completed job {job_id} atomically")
            return job
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to complete job {job_id} atomically: {e}")
            raise
    
    async def cancel_job_assignment_atomically(self, job_id: UUID, user_id: UUID) -> Job:
        """
        Atomically cancel job assignment (only for job owner when status is ACCEPTED).
        """
        try:
            result = await self.db.execute(
                select(Job).where(Job.id == job_id).with_for_update()
            )
            job = result.scalar_one_or_none()
            
            if not job:
                raise JobNotFoundError(f"Job {job_id} not found")
            
            # Validate ownership and status
            if job.user_id != user_id:
                raise JobNotFoundError("Access denied")
            
            if job.status != JobStatus.ACCEPTED:
                raise InvalidJobTransitionError(
                    f"Cannot cancel job in {job.status} status"
                )
            
            # Reset assignment and status
            assigned_genie = job.assigned_genie
            job.assigned_genie = None
            job.status = JobStatus.POSTED
            
            await self.db.commit()
            await self.db.refresh(job)
            
            logger.info(f"User {user_id} cancelled assignment of job {job_id} from genie {assigned_genie}")
            return job
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to cancel job assignment {job_id} atomically: {e}")
            raise
