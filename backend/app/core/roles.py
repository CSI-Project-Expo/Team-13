from fastapi import HTTPException, status, Depends
from typing import List, Union
from app.core.auth import get_current_active_user
from app.models.user import User


def require_role(allowed_roles: Union[List[str], str]):
    """Dependency factory for role-based authorization"""
    
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    
    async def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


# Common role dependencies
require_user = require_role(["user"])
require_genie = require_role(["genie"])
require_admin = require_role(["admin"])
require_user_or_admin = require_role(["user", "admin"])
require_genie_or_admin = require_role(["genie", "admin"])
require_any_role = require_role(["user", "genie", "admin"])


def check_resource_ownership(resource_user_id: str, current_user: User) -> bool:
    """Check if current user owns the resource or is admin"""
    return current_user.id == resource_user_id or current_user.role == "admin"


def require_ownership_or_admin(resource_user_id: str):
    """Dependency factory for ownership or admin access"""
    
    async def ownership_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if not check_resource_ownership(resource_user_id, current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only access your own resources."
            )
        return current_user
    
    return ownership_checker
