from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.database import get_db
from app.core.auth import get_current_active_user
from app.core.roles import require_any_role
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.wallet import (
    WalletResponse, TransactionRequest, TransactionResponse
)
from app.services.wallet_service import WalletService

router = APIRouter()


@router.get("/", response_model=WalletResponse)
async def get_my_wallet(
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's wallet information"""
    wallet_service = WalletService(db)
    wallet = await wallet_service.get_or_create_wallet(current_user.id)
    
    # Load user relationship for response
    result = await db.execute(
        select(Wallet)
        .options(selectinload(Wallet.user))
        .where(Wallet.user_id == current_user.id)
    )
    wallet = result.scalar_one()
    
    return wallet


@router.post("/add-funds", response_model=TransactionResponse)
async def add_funds(
    transaction: TransactionRequest,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Add funds to wallet balance"""
    wallet_service = WalletService(db)
    result = await wallet_service.add_funds_atomically(
        current_user.id,
        transaction.amount,
        transaction.description
    )
    return result


@router.post("/withdraw", response_model=TransactionResponse)
async def withdraw_funds(
    transaction: TransactionRequest,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Withdraw funds from wallet balance"""
    wallet_service = WalletService(db)
    result = await wallet_service.withdraw_funds_atomically(
        current_user.id,
        transaction.amount,
        transaction.description
    )
    return result


@router.post("/transfer-to-escrow", response_model=TransactionResponse)
async def transfer_to_escrow(
    transaction: TransactionRequest,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Transfer funds from wallet balance to escrow (for job payments)"""
    wallet_service = WalletService(db)
    result = await wallet_service.transfer_to_escrow_atomically(
        current_user.id,
        transaction.amount
    )
    return result


@router.post("/release-from-escrow", response_model=TransactionResponse)
async def release_from_escrow(
    transaction: TransactionRequest,
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Release funds from escrow back to wallet balance"""
    wallet_service = WalletService(db)
    result = await wallet_service.release_from_escrow_atomically(
        current_user.id,
        transaction.amount
    )
    return result


@router.get("/balance")
async def get_balance(
    current_user: User = Depends(require_any_role),
    db: AsyncSession = Depends(get_db)
):
    """Get current wallet balance (simple endpoint)"""
    wallet_service = WalletService(db)
    wallet = await wallet_service.get_or_create_wallet(current_user.id)
    
    return {
        "balance": float(wallet.balance),
        "escrow_balance": float(wallet.escrow_balance),
        "total_balance": float(wallet.balance + wallet.escrow_balance)
    }
