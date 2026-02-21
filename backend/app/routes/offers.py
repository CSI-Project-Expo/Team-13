from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.core.auth import get_current_active_user
from app.core.roles import require_genie, require_user, require_any_role
from app.models.user import User
from app.models.job import JobStatus
from app.models.offer import Offer
from app.schemas.offer import OfferCreate, OfferUpdate, OfferResponse
from app.services.job_service import JobService

router = APIRouter()


class OfferService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_offer(self, offer_data: OfferCreate, genie_id: UUID) -> Offer:
        """Create a new offer for a job"""
        # Verify job exists and is in POSTED status
        job_service = JobService(self.db)
        job = await job_service.get_job_by_id(offer_data.job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )
        
        if job.status != JobStatus.POSTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot make offers on jobs that are not posted"
            )
        
        # Check if genie already made an offer
        result = await self.db.execute(
            select(Offer).where(
                Offer.job_id == offer_data.job_id,
                Offer.genie_id == genie_id
            )
        )
        existing_offer = result.scalar_one_or_none()
        
        if existing_offer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already made an offer for this job"
            )
        
        # Create offer
        offer = Offer(
            job_id=offer_data.job_id,
            genie_id=genie_id,
            offer_price=offer_data.offer_price,
            message=offer_data.message
        )
        
        self.db.add(offer)
        await self.db.commit()
        await self.db.refresh(offer)
        
        # Load relationships for response
        result = await self.db.execute(
            select(Offer)
            .options(
                selectinload(Offer.genie),
                selectinload(Offer.job)
            )
            .where(Offer.id == offer.id)
        )
        return result.scalar_one()
    
    async def get_offers_for_job(self, job_id: UUID, user_id: UUID) -> List[Offer]:
        """Get offers for a job (only for job owner)"""
        # Verify job ownership
        job_service = JobService(self.db)
        job = await job_service.get_job_by_id(job_id)
        
        if not job or job.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get offers
        from app.models.offer import Offer
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        
        result = await self.db.execute(
            select(Offer)
            .options(
                selectinload(Offer.genie),
                selectinload(Offer.job)
            )
            .where(Offer.job_id == job_id)
            .order_by(Offer.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_my_offers(self, genie_id: UUID) -> List[Offer]:
        """Get offers made by current genie"""
        result = await self.db.execute(
            select(Offer)
            .options(
                selectinload(Offer.genie),
                selectinload(Offer.job)
            )
            .where(Offer.genie_id == genie_id)
            .order_by(Offer.created_at.desc())
        )
        return result.scalars().all()
    
    async def update_offer(self, offer_id: UUID, offer_update: OfferUpdate, genie_id: UUID) -> Offer:
        """Update an offer"""
        result = await self.db.execute(select(Offer).where(Offer.id == offer_id))
        offer = result.scalar_one_or_none()
        
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        if offer.genie_id != genie_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if job is still in POSTED status
        job_service = JobService(self.db)
        job = await job_service.get_job_by_id(offer.job_id)
        
        if job.status != JobStatus.POSTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update offers for jobs that are not posted"
            )
        
        # Update offer
        update_data = offer_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(offer, field, value)
        
        await self.db.commit()
        await self.db.refresh(offer)
        
        # Load relationships for response
        result = await self.db.execute(
            select(Offer)
            .options(
                selectinload(Offer.genie),
                selectinload(Offer.job)
            )
            .where(Offer.id == offer_id)
        )
        return result.scalar_one()
    
    async def delete_offer(self, offer_id: UUID, genie_id: UUID) -> bool:
        """Delete an offer"""
        result = await self.db.execute(select(Offer).where(Offer.id == offer_id))
        offer = result.scalar_one_or_none()
        
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        if offer.genie_id != genie_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if job is still in POSTED status
        job_service = JobService(self.db)
        job = await job_service.get_job_by_id(offer.job_id)
        
        if job.status != JobStatus.POSTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete offers for jobs that are not posted"
            )
        
        await self.db.delete(offer)
        await self.db.commit()
        
        return True


@router.post("/", response_model=OfferResponse, status_code=status.HTTP_201_CREATED)
async def create_offer(
    offer_data: OfferCreate,
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Create a new offer for a job"""
    offer_service = OfferService(db)
    offer = await offer_service.create_offer(offer_data, current_user.id)
    return offer


@router.get("/job/{job_id}", response_model=List[OfferResponse])
async def get_offers_for_job(
    job_id: UUID,
    current_user: User = Depends(require_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all offers for a specific job (job owner only)"""
    offer_service = OfferService(db)
    offers = await offer_service.get_offers_for_job(job_id, current_user.id)
    return offers


@router.get("/my-offers", response_model=List[OfferResponse])
async def get_my_offers(
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Get all offers made by current genie"""
    offer_service = OfferService(db)
    offers = await offer_service.get_my_offers(current_user.id)
    return offers


@router.put("/{offer_id}", response_model=OfferResponse)
async def update_offer(
    offer_id: UUID,
    offer_update: OfferUpdate,
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Update an offer"""
    offer_service = OfferService(db)
    offer = await offer_service.update_offer(offer_id, offer_update, current_user.id)
    return offer


@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    offer_id: UUID,
    current_user: User = Depends(require_genie),
    db: AsyncSession = Depends(get_db)
):
    """Delete an offer"""
    offer_service = OfferService(db)
    await offer_service.delete_offer(offer_id, current_user.id)
