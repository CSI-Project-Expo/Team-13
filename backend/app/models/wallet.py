from sqlalchemy import Column, Numeric, UUID, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Wallet(Base):
    __tablename__ = "wallet"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    balance = Column(Numeric(10, 2), default=0)
    escrow_balance = Column(Numeric(10, 2), default=0)
    
    # Relationships
    user = relationship("User", back_populates="wallet")
