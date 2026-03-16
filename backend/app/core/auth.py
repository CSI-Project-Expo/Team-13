from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import httpx
import uuid

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
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
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


def verify_token(token: str) -> dict:
    """Synchronous token verification for WebSocket (no async context)"""
    import httpx
    from jose import jwt
    
    try:
        # Get JWKS from Supabase
        resp = httpx.get(SUPABASE_JWKS_URL, timeout=10.0)
        if resp.status_code != 200:
            logger.error(f"Failed to fetch JWKS: HTTP {resp.status_code}")
            raise ValueError(f"Failed to fetch JWKS")
        
        jwks_data = resp.json()
        
        # Get unverified header to find the kid
        try:
            headers = jwt.get_unverified_header(token)
            kid = headers.get("kid")
        except Exception as header_error:
            logger.error(f"Failed to get token header: {header_error}")
            raise ValueError("Invalid token format")
        
        if not kid:
            logger.error("Token header missing 'kid'")
            raise ValueError("Token missing key ID")
        
        # Find matching key from JWKS
        public_key = None
        for key in jwks_data.get("keys", []):
            if key.get("kid") == kid:
                public_key = key
                break
        
        if not public_key:
            logger.error(f"Key ID {kid} not found in JWKS")
            raise ValueError("Key not found")
        
        # Verify and decode token
        issuer = f"https://{settings.SUPABASE_URL.replace('https://', '').split('/')[0]}/auth/v1"
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256", "ES256"],
                audience="authenticated",
                issuer=issuer,
                options={"verify_signature": True}
            )
            logger.info(f"Token verified successfully for user {payload.get('sub')}")
            return payload
        except JWTError as jwt_error:
            logger.error(f"JWT verification failed: {jwt_error}")
            raise ValueError("Invalid token")
    
    except ValueError:
        raise
    except Exception as e:
        logger.error(f"Token verification error: {type(e).__name__}: {e}")
        raise ValueError("Token verification failed")


# For REST endpoints that need current user
get_current_user_ws = get_current_user
