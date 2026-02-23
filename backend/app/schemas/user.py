from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern="^(user|genie|admin)$")


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[str] = Field(None, pattern="^(user|genie|admin)$")


class UserResponse(UserBase):
    id: UUID
    reward_points: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    id: UUID
    name: Optional[str] = None
    role: Optional[str] = None
    reward_points: Optional[int] = 0
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class GenieProfile(BaseModel):
    id: UUID
    user_id: UUID
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    is_verified: bool = False
    user: Optional[UserProfile] = None
    
    class Config:
        from_attributes = True


class GenieUpdate(BaseModel):
    skills: Optional[List[str]] = None
    location: Optional[str] = None


# Used by the register endpoint — email/password are handled by Supabase on the frontend
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern="^(user|genie)$")


class RegisterResponse(BaseModel):
    id: str
    name: str
    role: str
