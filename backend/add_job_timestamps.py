"""
Migration script to add started_at and completed_at columns to jobs table
"""
import asyncio
from sqlalchemy import text
from app.database import engine


async def add_job_timestamps():
    async with engine.begin() as conn:
        # Add started_at column
        await conn.execute(text("""
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
        """))
        
        # Add completed_at column
        await conn.execute(text("""
            ALTER TABLE jobs 
            ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
        """))
        
        print("✅ Successfully added started_at and completed_at columns to jobs table")


if __name__ == "__main__":
    asyncio.run(add_job_timestamps())
