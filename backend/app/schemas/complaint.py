from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.schemas.user import UserProfile


class ComplaintStatus(str):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class ComplaintBase(BaseModel):
    reason: str = Field(..., min_length=1, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(OPEN|RESOLVED)$")


class ComplaintCreate(ComplaintBase):
    job_id: UUID


class ComplaintUpdate(BaseModel):
    reason: Optional[str] = Field(None, min_length=1, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(OPEN|RESOLVED)$")


class ComplaintResponse(ComplaintBase):
    id: UUID
    job_id: UUID
    complainant_id: UUID
    created_at: Optional[datetime] = None
    complainant: Optional[UserProfile] = None
    
    class Config:
        from_attributes = True
