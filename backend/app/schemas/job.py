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
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    user: Optional[UserProfile] = None
    genie: Optional[UserProfile] = None
    
    # Rating field from Genie to User
    genie_rating: Optional[int] = None
    rating_comment: Optional[str] = None
    rated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class JobWithDetails(JobResponse):
    offers: Optional[List["OfferResponse"]] = None
    ratings: Optional[List["RatingResponse"]] = None


# Forward references to avoid circular imports
from app.schemas.offer import OfferResponse
from app.schemas.rating import RatingResponse

JobWithDetails.model_rebuild()


class UserRatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


class UserRatingResponse(BaseModel):
    message: str
    points_awarded: int
    total_points: int
