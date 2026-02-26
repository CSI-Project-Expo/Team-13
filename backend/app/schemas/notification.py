from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime


class NotificationBase(BaseModel):
    title: str
    message: str


class NotificationCreate(NotificationBase):
    user_id: UUID


class NotificationResponse(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    total_count: int
