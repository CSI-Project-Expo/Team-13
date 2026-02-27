from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from uuid import UUID
from decimal import Decimal
import logging

from app.models.wallet import Wallet
from app.models.job import Job, JobStatus
from app.schemas.wallet import TransactionRequest, TransactionResponse
from app.utils.exceptions import InsufficientFundsError, WalletNotFoundError
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class WalletService:
    """Service for wallet operations with proper transaction handling"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_wallet_by_user(self, user_id: UUID) -> Optional[Wallet]:
        """Get wallet for a user"""
        result = await self.db.execute(
            select(Wallet).where(Wallet.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def create_wallet(self, user_id: UUID) -> Wallet:
        """Create a new wallet for a user"""
        wallet = Wallet(user_id=user_id, balance=0, escrow_balance=0)
        self.db.add(wallet)
        await self.db.commit()
        await self.db.refresh(wallet)
        
        logger.info(f"Created wallet for user {user_id}")
        return wallet
    
    async def get_or_create_wallet(self, user_id: UUID) -> Wallet:
        """Get existing wallet or create new one"""
        wallet = await self.get_wallet_by_user(user_id)
        if not wallet:
            wallet = await self.create_wallet(user_id)
        return wallet
    
    async def add_funds_atomically(self, user_id: UUID, amount: Decimal, description: Optional[str] = None) -> TransactionResponse:
        """
        Atomically add funds to user's wallet balance
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        try:
            # Lock wallet row for update
            result = await self.db.execute(
                select(Wallet).where(Wallet.user_id == user_id).with_for_update()
            )
            wallet = result.scalar_one_or_none()
            
            if not wallet:
                wallet = Wallet(user_id=user_id, balance=0, escrow_balance=0)
                self.db.add(wallet)
            
            # Add funds to balance
            wallet.balance += amount
            
            await self.db.commit()
            await self.db.refresh(wallet)
            
            logger.info(f"Added {amount} to wallet {user_id}. New balance: {wallet.balance}")
            
            return TransactionResponse(
                success=True,
                message=f"Successfully added {amount} to wallet",
                new_balance=wallet.balance
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to add funds to wallet {user_id}: {e}")
            raise
    
    async def transfer_to_escrow_atomically(self, user_id: UUID, amount: Decimal) -> TransactionResponse:
        """
        Atomically transfer funds from wallet balance to escrow
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        try:
            # Lock wallet row for update
            result = await self.db.execute(
                select(Wallet).where(Wallet.user_id == user_id).with_for_update()
            )
            wallet = result.scalar_one_or_none()
            
            if not wallet:
                raise WalletNotFoundError(f"Wallet not found for user {user_id}")
            
            # Check sufficient funds
            if wallet.balance < amount:
                raise InsufficientFundsError(
                    f"Insufficient funds. Available: {wallet.balance}, Required: {amount}"
                )
            
            # Transfer to escrow
            wallet.balance -= amount
            wallet.escrow_balance += amount
            
            await self.db.commit()
            await self.db.refresh(wallet)
            
            logger.info(f"Transferred {amount} to escrow for user {user_id}. Balance: {wallet.balance}, Escrow: {wallet.escrow_balance}")
            
            return TransactionResponse(
                success=True,
                message=f"Successfully transferred {amount} to escrow",
                new_balance=wallet.balance
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to transfer to escrow for wallet {user_id}: {e}")
            raise
    
    async def release_from_escrow_atomically(self, user_id: UUID, amount: Decimal) -> TransactionResponse:
        """
        Atomically release funds from escrow back to wallet balance
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        try:
            # Lock wallet row for update
            result = await self.db.execute(
                select(Wallet).where(Wallet.user_id == user_id).with_for_update()
            )
            wallet = result.scalar_one_or_none()
            
            if not wallet:
                raise WalletNotFoundError(f"Wallet not found for user {user_id}")
            
            # Check sufficient escrow funds
            if wallet.escrow_balance < amount:
                raise InsufficientFundsError(
                    f"Insufficient escrow funds. Available: {wallet.escrow_balance}, Required: {amount}"
                )
            
            # Release from escrow
            wallet.escrow_balance -= amount
            wallet.balance += amount
            
            await self.db.commit()
            await self.db.refresh(wallet)
            
            logger.info(f"Released {amount} from escrow for user {user_id}. Balance: {wallet.balance}, Escrow: {wallet.escrow_balance}")
            
            return TransactionResponse(
                success=True,
                message=f"Successfully released {amount} from escrow",
                new_balance=wallet.balance
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to release from escrow for wallet {user_id}: {e}")
            raise
    
    async def transfer_escrow_to_genie_atomically(self, from_user_id: UUID, to_genie_id: UUID, amount: Decimal) -> TransactionResponse:
        """
        Atomically transfer funds from user's escrow to genie's balance (for completed jobs)
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        try:
            # Lock both wallets for update
            user_wallet_result = await self.db.execute(
                select(Wallet).where(Wallet.user_id == from_user_id).with_for_update()
            )
            user_wallet = user_wallet_result.scalar_one_or_none()
            
            genie_wallet_result = await self.db.execute(
                select(Wallet).where(Wallet.user_id == to_genie_id).with_for_update()
            )
            genie_wallet = genie_wallet_result.scalar_one_or_none()
            
            if not user_wallet:
                raise WalletNotFoundError(f"User wallet not found for {from_user_id}")
            
            if not genie_wallet:
                # Create genie wallet if it doesn't exist
                genie_wallet = Wallet(user_id=to_genie_id, balance=0, escrow_balance=0)
                self.db.add(genie_wallet)
            
            # Check sufficient escrow funds
            if user_wallet.escrow_balance < amount:
                raise InsufficientFundsError(
                    f"Insufficient escrow funds. Available: {user_wallet.escrow_balance}, Required: {amount}"
                )
            
            # Transfer funds
            user_wallet.escrow_balance -= amount
            genie_wallet.balance += amount
            
            await self.db.commit()
            await self.db.refresh(user_wallet)
            await self.db.refresh(genie_wallet)
            
            # Notify genie about payment received
            notification_service = NotificationService(self.db)
            await notification_service.create_notification(
                user_id=to_genie_id,
                title="Payment received",
                message=f"You have received ₹{amount} in your wallet from a completed job."
            )
            
            logger.info(f"Transferred {amount} from user {from_user_id} escrow to genie {to_genie_id} balance")
            
            return TransactionResponse(
                success=True,
                message=f"Successfully transferred {amount} to genie",
                new_balance=genie_wallet.balance
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to transfer escrow to genie: {e}")
            raise
    
    async def withdraw_funds_atomically(self, user_id: UUID, amount: Decimal) -> TransactionResponse:
        """
        Atomically withdraw funds from user's wallet balance
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        try:
            # Lock wallet row for update
            result = await self.db.execute(
                select(Wallet).where(Wallet.user_id == user_id).with_for_update()
            )
            wallet = result.scalar_one_or_none()
            
            if not wallet:
                raise WalletNotFoundError(f"Wallet not found for user {user_id}")
            
            # Check sufficient funds
            if wallet.balance < amount:
                raise InsufficientFundsError(
                    f"Insufficient funds. Available: {wallet.balance}, Required: {amount}"
                )
            
            # Withdraw funds
            wallet.balance -= amount
            
            await self.db.commit()
            await self.db.refresh(wallet)
            
            logger.info(f"Withdrew {amount} from wallet {user_id}. New balance: {wallet.balance}")
            
            return TransactionResponse(
                success=True,
                message=f"Successfully withdrew {amount}",
                new_balance=wallet.balance
            )
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Failed to withdraw funds from wallet {user_id}: {e}")
            raise
