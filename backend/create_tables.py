"""
Create database tables for the application
Run this script once to initialize the messages table
"""
import asyncio
from app.database import engine, Base
from app.models import Message, User, Job, Offer, Wallet, Rating, Complaint, Notification


async def create_tables():
    """Create all tables in the database"""
    async with engine.begin() as conn:
        # Import all models to ensure they're registered with Base
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ All tables created successfully!")


if __name__ == "__main__":
    asyncio.run(create_tables())
