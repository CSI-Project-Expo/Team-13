from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import httpx

from app.core.config import settings
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

SUPABASE_JWKS_URL = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"


async def get_public_key(token: str):
    """Get public key from Supabase JWKS endpoint"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(SUPABASE_JWKS_URL)
            jwks = resp.json()
        headers = jwt.get_unverified_header(token)
        kid = headers["kid"]

        for key in jwks["keys"]:
            if key["kid"] == kid:
                return key

        raise HTTPException(status_code=401, detail="Public key not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch public key: {e}")
        raise HTTPException(status_code=401, detail="Failed to fetch public key")


async def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """Verify Supabase JWT token and return payload"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Remove Bearer prefix if present
        token = credentials.credentials
        if token.startswith("Bearer "):
            token = token[7:]
        
        # Get public key and decode JWT
        public_key = await get_public_key(token)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=f"https://{settings.SUPABASE_URL.replace('https://', '').split('/')[0]}/auth/v1"
        )
        
        return payload
        
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"JWT verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"JWT verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    payload: dict = Depends(verify_jwt_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from database"""
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user ID"
        )
    
    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    return current_user
