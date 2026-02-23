from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.auth import get_current_active_user
from app.core.roles import require_any_role
from app.models.user import User

router = APIRouter()


@router.get("/me")
async def get_me(
    current_user: User = Depends(require_any_role),
):
    """Return the current authenticated user's id, email stub, and role."""
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": None,          # email lives in Supabase Auth, not our DB
        "role": current_user.role,
    }
