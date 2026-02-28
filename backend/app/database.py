from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Create base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()


async def init_db():
    """Initialize database connection"""
    try:
        # Test database connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS skill_proofs JSONB"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS document_path VARCHAR"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS verification_status VARCHAR"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE"))
            # Create genie_locations table for live tracking
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS genie_locations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                    genie_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    latitude NUMERIC(10, 8) NOT NULL,
                    longitude NUMERIC(11, 8) NOT NULL,
                    accuracy NUMERIC(6, 2),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            # Create index for faster lookups
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_genie_locations_job_id ON genie_locations(job_id)
            """))
        logger.info("Database connection established successfully")
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        logger.info("Application will continue without database connection")


async def close_db():
    """Close database connection"""
    await engine.dispose()
