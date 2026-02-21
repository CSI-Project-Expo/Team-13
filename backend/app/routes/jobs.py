from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.core.auth import get_current_active_user
from app.core.roles import require_user, require_genie, require_any_role
from app.models.user import User
from app.models.job import JobStatus
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JobWithDetails
from app.services.job_service import JobService
from app.services.atomic_job_service import AtomicJobService
from app.services.ai_pricing import ai_pricing_service

router = APIRouter()


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new job"""
    job_service = JobService(db)
    job = await job_service.create_job(job_data, current_user.id)
    
    # Load relationships for response
    job = await job_service.get_job_by_id(job.id)
    return job


@router.get("/available", response_model=List[JobResponse])
async def get_available_jobs(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Get available jobs for genies to accept"""
    job_service = JobService(db)
    jobs = await job_service.get_available_jobs(limit=limit, offset=offset)
    return jobs


@router.get("/my-jobs", response_model=List[JobResponse])
async def get_my_jobs(
    status: Optional[JobStatus] = Query(None),
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Get jobs posted by current user or assigned to current genie"""
    job_service = JobService(db)
    
    if current_user.role == "user":
        jobs = await job_service.get_jobs_by_user(current_user.id, status)
    else:  # genie
        jobs = await job_service.get_jobs_assigned_to_genie(current_user.id, status)
    
    return jobs


@router.get("/{job_id}", response_model=JobWithDetails)
async def get_job(
    job_id: UUID,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Get job details by ID"""
    job_service = JobService(db)
    job = await job_service.get_job_by_id(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check access permissions
    if (current_user.role == "user" and job.user_id != current_user.id) or \
       (current_user.role == "genie" and job.assigned_genie != current_user.id and job.status != JobStatus.POSTED):
        # Allow genies to see posted jobs
        if not (current_user.role == "genie" and job.status == JobStatus.POSTED):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: UUID,
    job_update: JobUpdate,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Update job details"""
    job_service = JobService(db)
    job = await job_service.update_job(job_id, job_update, current_user.id)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a job"""
    job_service = JobService(db)
    await job_service.delete_job(job_id, current_user.id)


@router.post("/{job_id}/accept", response_model=JobResponse)
async def accept_job(
    job_id: UUID,
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Accept a job (atomic operation)"""
    atomic_service = AtomicJobService(db)
    job = await atomic_service.accept_job_atomically(job_id, current_user.id)
    
    # Load relationships for response
    job_service = JobService(db)
    job = await job_service.get_job_by_id(job.id)
    return job


@router.post("/{job_id}/start", response_model=JobResponse)
async def start_job(
    job_id: UUID,
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Start working on a job (atomic operation)"""
    atomic_service = AtomicJobService(db)
    job = await atomic_service.start_job_atomically(job_id, current_user.id)
    
    # Load relationships for response
    job_service = JobService(db)
    job = await job_service.get_job_by_id(job.id)
    return job


@router.post("/{job_id}/complete", response_model=JobResponse)
async def complete_job(
    job_id: UUID,
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Complete a job (atomic operation)"""
    atomic_service = AtomicJobService(db)
    job = await atomic_service.complete_job_atomically(job_id, current_user.id)
    
    # Load relationships for response
    job_service = JobService(db)
    job = await job_service.get_job_by_id(job.id)
    return job


@router.post("/{job_id}/cancel-assignment", response_model=JobResponse)
async def cancel_job_assignment(
    job_id: UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel job assignment (only for job owner)"""
    atomic_service = AtomicJobService(db)
    job = await atomic_service.cancel_job_assignment_atomically(job_id, current_user.id)
    
    # Load relationships for response
    job_service = JobService(db)
    job = await job_service.get_job_by_id(job.id)
    return job


@router.get("/{job_id}/price-estimate")
async def get_price_estimate(
    job_id: UUID,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered price estimate for a job"""
    job_service = JobService(db)
    job = await job_service.get_job_by_id(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Generate price estimate
    estimate = ai_pricing_service.estimate_price(
        title=job.title,
        description=job.description,
        location=job.location,
        duration=job.duration
    )
    
    return estimate


@router.post("/price-estimate")
async def get_price_estimate_for_job(
    job_data: JobCreate,
    current_user: User = Depends(require_any_role)
):
    """Get AI-powered price estimate for a job before creating it"""
    estimate = ai_pricing_service.estimate_price(
        title=job_data.title,
        description=job_data.description,
        location=job_data.location,
        duration=job_data.duration
    )
    
    return estimate
