from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.schemas.user import UserProfile


class OfferBase(BaseModel):
    offer_price: Optional[Decimal] = Field(None, ge=0)
    message: Optional[str] = Field(None, max_length=1000)


class OfferCreate(OfferBase):
    job_id: UUID


class OfferUpdate(BaseModel):
    offer_price: Optional[Decimal] = Field(None, ge=0)
    message: Optional[str] = Field(None, max_length=1000)


class OfferResponse(OfferBase):
    id: UUID
    job_id: UUID
    genie_id: UUID
    created_at: datetime
    genie: Optional[UserProfile] = None
    
    class Config:
        from_attributes = True
