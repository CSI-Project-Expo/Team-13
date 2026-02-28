from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from enum import Enum
import logging

from app.models.job import Job, JobStatus
from app.models.offer import Offer
from app.models.user import User
from app.models.message import Message
from app.schemas.job import JobCreate, JobUpdate, UserRatingRequest
from app.utils.exceptions import JobNotFoundError, InvalidJobTransitionError, JobAlreadyAssignedError, InsufficientFundsError
from datetime import datetime
from app.schemas.job import JobCreate, JobUpdate
from app.services.wallet_service import WalletService
from app.services.notification_service import NotificationService
from app.models.wallet import Wallet
logger = logging.getLogger(__name__)


class JobLifecycleValidator:
    """Validates job lifecycle transitions"""
    
    VALID_TRANSITIONS = {
        JobStatus.POSTED: [JobStatus.ACCEPTED],
        JobStatus.ACCEPTED: [JobStatus.IN_PROGRESS],
        JobStatus.IN_PROGRESS: [JobStatus.COMPLETED],
        JobStatus.COMPLETED: []  # Terminal state
    }
    
    @classmethod
    def validate_transition(cls, current_status: JobStatus, new_status: JobStatus) -> bool:
        """Validate if job status transition is allowed"""
        if current_status == new_status:
            return True  # No change is always valid
        
        allowed_transitions = cls.VALID_TRANSITIONS.get(current_status, [])
        return new_status in allowed_transitions
    
    @classmethod
    def get_valid_transitions(cls, current_status: JobStatus) -> List[JobStatus]:
        """Get list of valid next statuses for current status"""
        return cls.VALID_TRANSITIONS.get(current_status, [])


class JobService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_job(self, job_data: JobCreate, user_id: UUID) -> Job:
        """Create a new job"""
        job = Job(
            **job_data.model_dump(),
            user_id=user_id,
            status=JobStatus.POSTED
        )
        
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        
        logger.info(f"Created job {job.id} for user {user_id}")
        return job
    
    async def get_job_by_id(self, job_id: UUID) -> Optional[Job]:
        """Get job by ID with relationships"""
        result = await self.db.execute(
            select(Job)
            .options(
                selectinload(Job.user),
                selectinload(Job.genie),
                selectinload(Job.offers).selectinload(Offer.genie)
            )
            .where(Job.id == job_id)
        )
        return result.scalar_one_or_none()
    
    async def get_jobs_by_user(self, user_id: UUID, status: Optional[JobStatus] = None) -> List[Job]:
        """Get jobs posted by a user"""
        query = select(Job).options(
            selectinload(Job.user),
            selectinload(Job.genie),
            selectinload(Job.offers).selectinload(Offer.genie)
        ).where(Job.user_id == user_id)
        
        if status:
            query = query.where(Job.status == status)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_jobs_assigned_to_genie(self, genie_id: UUID, status: Optional[JobStatus] = None) -> List[Job]:
        """Get jobs assigned to a genie"""
        query = select(Job).options(
            selectinload(Job.user),
            selectinload(Job.genie),
            selectinload(Job.offers).selectinload(Offer.genie)
        ).where(Job.assigned_genie == genie_id)
        
        if status:
            query = query.where(Job.status == status)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_available_jobs(self, limit: int = 50, offset: int = 0) -> List[Job]:
        """Get available jobs (POSTED status) for genies to accept"""
        result = await self.db.execute(
            select(Job)
            .options(
                selectinload(Job.user),
                selectinload(Job.offers).selectinload(Offer.genie)
            )
            .where(Job.status == JobStatus.POSTED)
            .where(Job.assigned_genie.is_(None))
            .order_by(Job.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()
    
    async def update_job_status(self, job_id: UUID, new_status: JobStatus) -> Job:
        """Update job status with validation"""
        # Get current job
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            raise JobNotFoundError(f"Job {job_id} not found")
        
        # Validate transition
        if not JobLifecycleValidator.validate_transition(job.status, new_status):
            raise InvalidJobTransitionError(
                f"Invalid transition from {job.status} to {new_status}. "
                f"Valid transitions: {JobLifecycleValidator.get_valid_transitions(job.status)}"
            )
        
        # Update status
        job.status = new_status

        await self.db.commit()
        await self.db.refresh(job)
        
        logger.info(f"Updated job {job_id} status to {new_status}")
        return job
    
    async def update_job(self, job_id: UUID, job_update: JobUpdate, user_id: UUID) -> Job:
        """Update job details"""
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        
        if not job:
            raise JobNotFoundError(f"Job {job_id} not found")
        
        if job.user_id != user_id:
            raise JobNotFoundError("Access denied")
        
        # Update fields
        update_data = job_update.model_dump(exclude_unset=True)
        
        # Validate status transition if status is being updated
        if "status" in update_data:
            new_status = JobStatus(update_data["status"])
            if not JobLifecycleValidator.validate_transition(job.status, new_status):
                raise InvalidJobTransitionError(
                    f"Invalid transition from {job.status} to {new_status}"
                )
        
        for field, value in update_data.items():
            setattr(job, field, value)
        
        await self.db.commit()
        await self.db.refresh(job)
        
        logger.info(f"Updated job {job_id}")
        return job
    
    async def delete_job(self, job_id: UUID, user_id: UUID) -> bool:
        """Delete a job (only if POSTED and no offers)"""
        result = await self.db.execute(
            select(Job)
            .options(selectinload(Job.offers))
            .where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            raise JobNotFoundError(f"Job {job_id} not found")
        
        if job.user_id != user_id:
            raise JobNotFoundError("Access denied")
        
        if job.status != JobStatus.POSTED:
            raise InvalidJobTransitionError("Can only delete jobs in POSTED status")
        
        if job.offers:
            raise InvalidJobTransitionError("Cannot delete job with existing offers")
        
        await self.db.delete(job)
        await self.db.commit()
        
        logger.info(f"Deleted job {job_id}")
        return True

    async def accept_job(
        self,
        job_id: UUID,
        genie_id: UUID,
        genie_role: str
    ) -> dict:
        """
        Accept a job by a genie with wallet validation and escrow transfer.
        All operations happen in a single atomic transaction.
        """
        # 1. Verify genie role
        if genie_role not in ["genie", "admin"]:
            raise InvalidJobTransitionError("Only genies can accept jobs")
        
        # 2. Get genie user info
        genie_result = await self.db.execute(
            select(User).where(User.id == genie_id)
        )
        genie = genie_result.scalar_one_or_none()
        
        if not genie:
            raise InvalidJobTransitionError("Genie user not found")
        
        # 3. Get job with user and wallet info
        result = await self.db.execute(
            select(Job)
            .options(
                selectinload(Job.user).selectinload(User.wallet)
            )
            .where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            raise JobNotFoundError(f"Job {job_id} not found")
        
        # 4. Verify job status is POSTED
        if job.status != JobStatus.POSTED:
            raise InvalidJobTransitionError(
                f"Job must be in POSTED status to accept. Current status: {job.status}"
            )
        
        # 5. Check if job is already assigned
        if job.assigned_genie is not None:
            raise JobAlreadyAssignedError("Job has already been assigned to another genie")
        
        # 6. Check if job has a price
        if job.price is None or job.price <= 0:
            raise InvalidJobTransitionError("Job must have a valid price to be accepted")
        
        # 7. Get user wallet
        user = job.user
        if not user or not user.wallet:
            raise InvalidJobTransitionError("Job poster does not have a wallet")
        
        wallet = user.wallet
        job_price = job.price
        
        # 8. Validate wallet balance
        if wallet.balance < job_price:
            raise InsufficientFundsError(
                f"Insufficient wallet balance. Available: ₹{wallet.balance}, Required: ₹{job_price}"
            )
        
        # 9. Perform atomic operations
        try:
            # Lock wallet row for update (prevent race conditions)
            wallet_result = await self.db.execute(
                select(Wallet).where(Wallet.user_id == user.id).with_for_update()
            )
            locked_wallet = wallet_result.scalar_one()
            
            # Double-check balance after locking
            if locked_wallet.balance < job_price:
                raise InsufficientFundsError(
                    f"Insufficient wallet balance. Available: ₹{locked_wallet.balance}, Required: ₹{job_price}"
                )
            
            # Deduct from balance and add to escrow
            locked_wallet.balance -= job_price
            locked_wallet.escrow_balance += job_price
            
            # Assign genie to job
            job.assigned_genie = genie_id
            job.status = JobStatus.ACCEPTED
            
            # Flush changes to DB
            await self.db.flush()
            
            logger.info(
                f"Job {job_id} accepted by genie {genie_id}. "
                f"Escrow: ₹{job_price} from user {user.id}"
            )
            
            # 10. Create automatic message from genie to user
            auto_message = Message(
                job_id=job_id,
                sender_id=genie_id,
                content=f"Hello! I'm {genie.name} and I've accepted your job '{job.title}'. I'll review the details and reach out if I have any questions. Looking forward to working with you!",
                is_read=False
            )
            self.db.add(auto_message)
            
            # 11. Create notification for user (after main transaction flush)
            notification_service = NotificationService(self.db)
            await notification_service.create_notification(
                user_id=user.id,
                title="Your job has been accepted",
                message=f"Your job '{job.title}' has been accepted by a Genie. ₹{job_price} has been moved to escrow."
            )
            
            # Commit all changes
            await self.db.commit()
            await self.db.refresh(locked_wallet)
            
            # Check for low balance and notify user
            if locked_wallet.balance < 500:  # Threshold: ₹500
                try:
                    notification_service = NotificationService(self.db)
                    await notification_service.create_notification(
                        user_id=user.id,
                        title="Low wallet balance",
                        message=f"Your wallet balance is low (₹{locked_wallet.balance}). Please add funds to continue posting jobs."
                    )
                    await self.db.commit()
                except Exception as notification_error:
                    await self.db.rollback()
                    logger.warning(
                        f"Job {job_id} accepted but low-balance notification failed for user {user.id}: {notification_error}"
                    )
            
            return {
                "message": "Job accepted successfully",
                "escrow_amount": float(job_price),
                "user_wallet_balance": float(locked_wallet.balance)
            }
            
        except InsufficientFundsError:
            await self.db.rollback()
            raise
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to accept job {job_id}: {e}")
            raise InvalidJobTransitionError(f"Failed to accept job: {str(e)}")

    async def rate_user(self, job_id: UUID, rating_data: UserRatingRequest, genie_id: UUID) -> dict:
        # 1. Get job and verify
        result = await self.db.execute(
            select(Job)
            .options(selectinload(Job.user))
            .where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()

        if not job:
            raise JobNotFoundError(f"Job {job_id} not found")

        # 2. Security: Ensure only assigned genie can rate
        if job.assigned_genie != genie_id:
            raise InvalidJobTransitionError("Only the assigned genie can rate the user")

        # 3. Security: Prevent rating before completion
        if job.status != JobStatus.COMPLETED:
            raise InvalidJobTransitionError("Job must be COMPLETED before rating the user")

        # 4. Security: Prevent duplicate rating
        if job.genie_rating is not None:
            raise InvalidJobTransitionError("Job has already been rated")

        # 5. Calculation: Reward logic
        # 5 stars → 50 points, 4 stars → 30 points, 3 stars → 10 points
        points_map = {5: 50, 4: 30, 3: 10, 2: 0, 1: 0}
        points_awarded = points_map.get(rating_data.rating, 0)

        # 6. Update Job
        job.genie_rating = rating_data.rating
        job.rating_comment = rating_data.comment
        job.rated_at = datetime.now()

        # 7. Update User Reward Points
        user = job.user
        user.reward_points += points_awarded

        # 8. Commit everything in one transaction
        await self.db.commit()
        await self.db.refresh(user)
        
        # 9. Notify user about rating received
        notification_service = NotificationService(self.db)
        try:
            await notification_service.create_notification(
                user_id=user.id,
                title="You received a rating",
                message=f"A Genie rated you {rating_data.rating} stars for job '{job.title}'. You earned {points_awarded} reward points!"
            )
            await self.db.commit()
        except Exception as notification_error:
            await self.db.rollback()
            logger.warning(
                f"Rating saved for job {job_id} but notification failed for user {user.id}: {notification_error}"
            )

        return {
            "message": "Rating submitted successfully",
            "points_awarded": points_awarded,
            "total_points": user.reward_points
        }

