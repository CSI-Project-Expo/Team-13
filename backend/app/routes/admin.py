from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.core.auth import get_current_active_user
from app.core.roles import require_admin
from app.models.user import User
from app.models.job import Job, JobStatus
from app.models.offer import Offer
from app.models.wallet import Wallet
from app.models.rating import Rating
from app.models.complaint import Complaint, ComplaintStatus
from app.schemas.user import UserResponse, UserProfile
from app.schemas.job import JobResponse
from app.schemas.complaint import ComplaintResponse

router = APIRouter()


@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard statistics"""
    
    # Get user counts by role
    user_counts = await db.execute(
        select(User.role, func.count(User.id))
        .group_by(User.role)
    )
    users_by_role = {row[0]: row[1] for row in user_counts.all()}
    
    # Get job counts by status
    job_counts = await db.execute(
        select(Job.status, func.count(Job.id))
        .group_by(Job.status)
    )
    jobs_by_status = {row[0]: row[1] for row in job_counts.all()}
    
    # Get total wallet balances
    total_balances = await db.execute(
        select(
            func.sum(Wallet.balance).label("total_balance"),
            func.sum(Wallet.escrow_balance).label("total_escrow")
        )
    )
    balances = total_balances.first()
    
    # Get open complaints count
    open_complaints = await db.execute(
        select(func.count(Complaint.id))
        .where(Complaint.status == ComplaintStatus.OPEN)
    )
    open_complaints_count = open_complaints.scalar()
    
    # Get recent jobs
    recent_jobs_result = await db.execute(
        select(Job)
        .options(
            selectinload(Job.user),
            selectinload(Job.genie)
        )
        .order_by(Job.created_at.desc())
        .limit(5)
    )
    recent_jobs = recent_jobs_result.scalars().all()
    
    return {
        "users_by_role": users_by_role,
        "jobs_by_status": jobs_by_status,
        "total_balances": {
            "balance": float(balances.total_balance or 0),
            "escrow": float(balances.total_escrow or 0)
        },
        "open_complaints": open_complaints_count,
        "recent_jobs": [
            {
                "id": job.id,
                "title": job.title,
                "status": job.status,
                "user": job.user.name if job.user else None,
                "genie": job.genie.name if job.genie else None,
                "created_at": job.created_at
            }
            for job in recent_jobs
        ]
    }


@router.get("/users")
async def get_all_users(
    role: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all users (admin only)"""
    query = select(User).order_by(User.created_at.desc())
    
    if role:
        query = query.where(User.role == role)
    
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    users = result.scalars().all()

    sanitized_users = []
    for user in users:
        safe_role = (user.role or "user").lower()
        if safe_role not in {"user", "genie", "admin"}:
            safe_role = "user"

        safe_name = (user.name or "Unnamed User").strip() or "Unnamed User"

        sanitized_users.append(
            {
                "id": user.id,
                "name": safe_name,
                "role": safe_role,
                "reward_points": user.reward_points or 0,
                "created_at": user.created_at,
            }
        )

    return sanitized_users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed user information (admin only)"""
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.genie_profile),
            selectinload(User.wallet)
        )
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    new_role: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update user role (admin only)"""
    if new_role not in ["user", "genie", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be one of: user, genie, admin"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = new_role
    await db.commit()
    
    return {"message": f"User role updated to {new_role}"}


@router.get("/jobs", response_model=List[JobResponse])
async def get_all_jobs(
    status: Optional[JobStatus] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all jobs (admin only)"""
    query = select(Job).options(
        selectinload(Job.user),
        selectinload(Job.genie),
        selectinload(Job.offers)
    ).order_by(Job.created_at.desc())
    
    if status:
        query = query.where(Job.status == status)
    
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return jobs


@router.get("/complaints", response_model=List[ComplaintResponse])
async def get_all_complaints(
    status: Optional[ComplaintStatus] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all complaints (admin only)"""
    query = select(Complaint).options(
        selectinload(Complaint.complainant),
        selectinload(Complaint.job)
    ).order_by(Complaint.created_at.desc())
    
    if status:
        query = query.where(Complaint.status == status)
    
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    complaints = result.scalars().all()
    
    return complaints


@router.put("/complaints/{complaint_id}/resolve")
async def resolve_complaint(
    complaint_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Resolve a complaint (admin only)"""
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )
    
    complaint.status = ComplaintStatus.RESOLVED
    await db.commit()
    
    return {"message": "Complaint resolved successfully"}


@router.get("/financial-summary")
async def get_financial_summary(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get financial summary (admin only)"""
    
    # Total wallet balances
    wallet_summary = await db.execute(
        select(
            func.count(Wallet.user_id).label("total_wallets"),
            func.sum(Wallet.balance).label("total_balance"),
            func.sum(Wallet.escrow_balance).label("total_escrow"),
            func.avg(Wallet.balance).label("avg_balance")
        )
    )
    wallet_data = wallet_summary.first()
    
    # Job value summary
    job_summary = await db.execute(
        select(
            func.count(Job.id).label("total_jobs"),
            func.sum(Job.price).label("total_job_value"),
            func.avg(Job.price).label("avg_job_value")
        )
        .where(Job.price.isnot(None))
    )
    job_data = job_summary.first()
    
    # Active jobs value
    active_jobs_value = await db.execute(
        select(func.sum(Job.price))
        .where(Job.status.in_([JobStatus.ACCEPTED, JobStatus.IN_PROGRESS]))
        .where(Job.price.isnot(None))
    )
    active_value = active_jobs_value.scalar() or 0
    
    return {
        "wallets": {
            "total_wallets": wallet_data.total_wallets,
            "total_balance": float(wallet_data.total_balance or 0),
            "total_escrow": float(wallet_data.total_escrow or 0),
            "avg_balance": float(wallet_data.avg_balance or 0)
        },
        "jobs": {
            "total_jobs": job_data.total_jobs,
            "total_value": float(job_data.total_job_value or 0),
            "avg_value": float(job_data.avg_job_value or 0),
            "active_jobs_value": float(active_value)
        }
    }
