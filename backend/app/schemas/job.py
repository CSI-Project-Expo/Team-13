from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.schemas.user import UserProfile


class JobStatus(str):
    POSTED = "POSTED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class JobBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=2000)
    location: Optional[str] = Field(None, max_length=200)
    duration: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)


class JobCreate(JobBase):
    pass


class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=2000)
    location: Optional[str] = Field(None, max_length=200)
    duration: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(POSTED|ACCEPTED|IN_PROGRESS|COMPLETED)$")


class JobResponse(JobBase):
    id: UUID
    user_id: UUID
    assigned_genie: Optional[UUID] = None
    status: str
    created_at: datetime
    user: Optional[UserProfile] = None
    genie: Optional[UserProfile] = None
    
    class Config:
        from_attributes = True


class JobWithDetails(JobResponse):
    offers: Optional[List["OfferResponse"]] = None
    ratings: Optional[List["RatingResponse"]] = None


# Forward references to avoid circular imports
from app.schemas.offer import OfferResponse
from app.schemas.rating import RatingResponse

JobWithDetails.model_rebuild()
