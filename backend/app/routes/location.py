from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.database import get_db
from app.core.auth import get_current_active_user
from app.core.roles import require_genie, require_any_role
from app.models.user import User
from app.models.job import Job, JobStatus
from app.models.location import GenieLocation

router = APIRouter()
MAX_LOCATION_ACCURACY_METERS = 9999.99


def _normalize_accuracy(accuracy: Optional[float]) -> Optional[float]:
    if accuracy is None:
        return None
    if accuracy < 0:
        return 0.0
    return min(accuracy, MAX_LOCATION_ACCURACY_METERS)


class LocationUpdateRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    accuracy: Optional[float] = Field(None, ge=0, description="Accuracy in meters")


class LocationResponse(BaseModel):
    id: str
    job_id: str
    genie_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float]
    updated_at: str


@router.post("/{job_id}/location", response_model=LocationResponse)
async def update_location(
    job_id: UUID,
    location_data: LocationUpdateRequest,
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """
    Update genie's live location for an active job.
    Only the assigned genie can update location.
    """
    # Verify job exists and genie is assigned
    result = await db.execute(
        select(Job).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Only assigned genie can update location
    if job.assigned_genie != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned genie can update location"
        )
    
    # Only update location for active jobs
    if job.status != JobStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update location for in-progress jobs"
        )
    
    normalized_accuracy = _normalize_accuracy(location_data.accuracy)

    # Check if location record exists for this job
    result = await db.execute(
        select(GenieLocation)
        .where(GenieLocation.job_id == job_id)
        .order_by(GenieLocation.updated_at.desc())
        .limit(1)
    )
    existing_location = result.scalar_one_or_none()
    
    if existing_location:
        # Update existing location
        existing_location.latitude = location_data.latitude
        existing_location.longitude = location_data.longitude
        existing_location.accuracy = normalized_accuracy
        existing_location.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_location)
        return existing_location.to_dict()
    else:
        # Create new location record
        new_location = GenieLocation(
            job_id=job_id,
            genie_id=current_user.id,
            latitude=location_data.latitude,
            longitude=location_data.longitude,
            accuracy=normalized_accuracy,
            updated_at=datetime.utcnow()
        )
        db.add(new_location)
        await db.commit()
        await db.refresh(new_location)
        return new_location.to_dict()


@router.get("/{job_id}/location", response_model=Optional[LocationResponse])
async def get_location(
    job_id: UUID,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """
    Get genie's live location for a job.
    Job owner or assigned genie can view location.
    """
    # Verify job exists
    result = await db.execute(
        select(Job).where(Job.id == job_id)
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check permissions: job owner or assigned genie
    is_owner = job.user_id == current_user.id
    is_assigned_genie = job.assigned_genie == current_user.id
    
    if not (is_owner or is_assigned_genie):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only job owner or assigned genie can view location"
        )
    
    # Get location
    result = await db.execute(
        select(GenieLocation)
        .where(GenieLocation.job_id == job_id)
        .order_by(GenieLocation.updated_at.desc())
        .limit(1)
    )
    location = result.scalar_one_or_none()
    
    if not location:
        return None
    
    return location.to_dict()
