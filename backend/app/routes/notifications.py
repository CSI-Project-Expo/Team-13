from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.database import get_db
from app.core.auth import get_current_active_user
from app.core.roles import require_any_role
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationListResponse
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    limit: int = 50,
    include_read: bool = False,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Get notifications for current user"""
    notification_service = NotificationService(db)
    notifications = await notification_service.get_user_notifications(
        user_id=current_user.id,
        limit=limit,
        include_read=include_read
    )
    
    unread_count = await notification_service.get_unread_count(current_user.id)
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total_count": len(notifications)
    }


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read"""
    notification_service = NotificationService(db)
    notification = await notification_service.mark_as_read(notification_id, current_user.id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification


@router.patch("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read"""
    notification_service = NotificationService(db)
    count = await notification_service.mark_all_as_read(current_user.id)
    
    return {
        "message": f"Marked {count} notifications as read",
        "marked_count": count
    }
