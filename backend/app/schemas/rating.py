from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.schemas.user import UserProfile


class RatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


class RatingCreate(RatingBase):
    job_id: UUID
    reviewee_id: UUID


class RatingUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


class RatingResponse(RatingBase):
    id: UUID
    job_id: UUID
    reviewer_id: UUID
    reviewee_id: UUID
    reviewer: Optional[UserProfile] = None
    reviewee: Optional[UserProfile] = None
    
    class Config:
        from_attributes = True
