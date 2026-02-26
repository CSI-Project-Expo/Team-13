from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from uuid import UUID
import logging

from app.models.notification import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for managing user notifications"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_notification(
        self,
        user_id: UUID,
        title: str,
        message: str
    ) -> Notification:
        """
        Create a new notification for a user.
        This operation is non-transactional (runs in separate commit)
        to avoid interfering with main business logic transactions.
        """
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            is_read=False
        )
        self.db.add(notification)
        await self.db.flush()
        
        logger.info(f"Created notification for user {user_id}: {title}")
        return notification
    
    async def get_user_notifications(
        self,
        user_id: UUID,
        limit: int = 50,
        include_read: bool = False
    ) -> List[Notification]:
        """Get notifications for a user"""
        query = select(Notification).where(Notification.user_id == user_id)
        
        if not include_read:
            query = query.where(Notification.is_read == False)
        
        query = query.order_by(Notification.created_at.desc()).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def mark_as_read(self, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
        """Mark a notification as read"""
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
        notification = result.scalar_one_or_none()
        
        if notification:
            notification.is_read = True
            await self.db.commit()
            await self.db.refresh(notification)
            logger.info(f"Marked notification {notification_id} as read")
        
        return notification
    
    async def mark_all_as_read(self, user_id: UUID) -> int:
        """Mark all notifications as read for a user. Returns count updated."""
        notifications = await self.get_user_notifications(user_id, include_read=False)
        
        count = 0
        for notification in notifications:
            notification.is_read = True
            count += 1
        
        if count > 0:
            await self.db.commit()
            logger.info(f"Marked {count} notifications as read for user {user_id}")
        
        return count
    
    async def get_unread_count(self, user_id: UUID) -> int:
        """Get count of unread notifications for a user"""
        result = await self.db.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
        return len(result.scalars().all())
