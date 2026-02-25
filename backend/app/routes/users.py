from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import logging

from app.database import get_db
from app.core.auth import verify_jwt_token
from app.core.roles import require_any_role
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me")
async def get_me(
    payload: dict = Depends(verify_jwt_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the current authenticated user's profile.
    On first login after signup, auto-creates the public.users row
    using the name and role stored in Supabase JWT metadata.
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    # ── First login: auto-create profile from Supabase metadata ─────────────
    if not user:
        meta = payload.get("user_metadata") or {}
        name = meta.get("name") or "User"
        role = meta.get("role") or "user"
        if role not in ("user", "genie", "admin"):
            role = "user"

        try:
            user = User(id=uuid.UUID(user_id), name=name, role=role)
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"Auto-created profile for new user {user_id} (role={role})")
        except Exception as exc:
            await db.rollback()
            logger.error(f"Failed to auto-create profile for {user_id}: {exc}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user profile.",
            )

    return {
        "id": str(user.id),
        "name": user.name,
        "email": None,   # email lives in Supabase Auth, not our DB
        "role": user.role,
        "reward_points": user.reward_points,
    }


@router.patch("/me")
async def update_me(
    body: dict,
    payload: dict = Depends(verify_jwt_token),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's name."""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_name = (body.get("name") or "").strip()
    if not new_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name cannot be empty")

    user.name = new_name
    await db.commit()
    await db.refresh(user)

    return {"id": str(user.id), "name": user.name, "role": user.role}

