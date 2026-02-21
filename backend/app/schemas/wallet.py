from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from uuid import UUID

from app.schemas.user import UserProfile


class WalletBase(BaseModel):
    balance: Decimal = Field(default=0, ge=0)
    escrow_balance: Decimal = Field(default=0, ge=0)


class WalletResponse(WalletBase):
    user_id: UUID
    user: Optional[UserProfile] = None
    
    class Config:
        from_attributes = True


class WalletUpdate(BaseModel):
    balance: Optional[Decimal] = Field(None, ge=0)
    escrow_balance: Optional[Decimal] = Field(None, ge=0)


class TransactionRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    success: bool
    message: str
    new_balance: Optional[Decimal] = None
