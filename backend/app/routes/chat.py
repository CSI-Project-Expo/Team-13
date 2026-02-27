from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Dict, Set
import json
from uuid import UUID
from datetime import datetime

from app.database import get_db
from app.models.message import Message
from app.models.job import Job
from app.models.user import User
from app.core.auth import get_current_user_ws


router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])


# Store active WebSocket connections per job
class ConnectionManager:
    def __init__(self):
        # job_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, job_id: str):
        await websocket.accept()
        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()
        self.active_connections[job_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, job_id: str):
        if job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]
    
    async def broadcast(self, message: dict, job_id: str, exclude: WebSocket = None):
        if job_id in self.active_connections:
            for connection in self.active_connections[job_id]:
                if connection != exclude:
                    try:
                        await connection.send_json(message)
                    except:
                        pass


manager = ConnectionManager()


@router.websocket("/ws/{job_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """WebSocket endpoint for real-time chat"""
    user_id = None
    
    try:
        # Get token from query params
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify user from token
        try:
            from app.core.auth import verify_token
            payload = verify_token(token)
            user_id = UUID(payload.get("sub"))
        except:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Verify job exists and user is involved
        result = await db.execute(
            select(Job).where(Job.id == UUID(job_id))
        )
        job = result.scalar_one_or_none()
        
        if not job:
            await websocket.close(code=status.WS_1003_UNSUPPORTED_DATA)
            return
        
        # Check if user is part of this job (either creator or assigned genie)
        if job.user_id != user_id and job.assigned_genie != user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Check if job is in a state that allows chatting
        if job.status not in ["ACCEPTED", "IN_PROGRESS", "POSTED"]:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        await manager.connect(websocket, job_id)
        
        # Send chat history
        messages_result = await db.execute(
            select(Message, User.name)
            .join(User, Message.sender_id == User.id)
            .where(Message.job_id == UUID(job_id))
            .order_by(Message.created_at.asc())
        )
        
        history = []
        for msg, sender_name in messages_result.all():
            history.append({
                "id": str(msg.id),
                "sender_id": str(msg.sender_id),
                "sender_name": sender_name,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
                "is_read": msg.is_read
            })
        
        await websocket.send_json({
            "type": "history",
            "messages": history
        })
        
        # Listen for messages
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "message":
                content = data.get("content", "").strip()
                if not content:
                    continue
                
                # Save message to database
                new_message = Message(
                    job_id=UUID(job_id),
                    sender_id=user_id,
                    content=content,
                    is_read=False
                )
                db.add(new_message)
                await db.commit()
                await db.refresh(new_message)
                
                # Get sender name
                sender_result = await db.execute(
                    select(User.name).where(User.id == user_id)
                )
                sender_name = sender_result.scalar_one()
                
                # Broadcast to all connections in this job
                message_data = {
                    "type": "new_message",
                    "message": {
                        "id": str(new_message.id),
                        "sender_id": str(new_message.sender_id),
                        "sender_name": sender_name,
                        "content": new_message.content,
                        "created_at": new_message.created_at.isoformat(),
                        "is_read": new_message.is_read
                    }
                }
                
                await manager.broadcast(message_data, job_id)
                
            elif data.get("type") == "mark_read":
                # Mark messages as read
                await db.execute(
                    Message.__table__.update()
                    .where(
                        and_(
                            Message.job_id == UUID(job_id),
                            Message.sender_id != user_id
                        )
                    )
                    .values(is_read=True)
                )
                await db.commit()
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, job_id)


@router.get("/{job_id}/messages")
async def get_job_messages(
    job_id: str,
    current_user: User = Depends(get_current_user_ws),
    db: AsyncSession = Depends(get_db)
):
    """Get all messages for a job (REST endpoint as fallback)"""
    
    # Verify job exists and user is involved
    result = await db.execute(
        select(Job).where(Job.id == UUID(job_id))
    )
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.user_id != current_user.id and job.assigned_genie != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get messages
    messages_result = await db.execute(
        select(Message, User.name)
        .join(User, Message.sender_id == User.id)
        .where(Message.job_id == UUID(job_id))
        .order_by(Message.created_at.asc())
    )
    
    messages = []
    for msg, sender_name in messages_result.all():
        messages.append({
            "id": str(msg.id),
            "sender_id": str(msg.sender_id),
            "sender_name": sender_name,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
            "is_read": msg.is_read
        })
    
    return messages
