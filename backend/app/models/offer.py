from sqlalchemy import Column, String, DateTime, text, Numeric, UUID, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Offer(Base):
    __tablename__ = "offers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    genie_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    offer_price = Column(Numeric(10, 2), nullable=True)
    message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    
    # Relationships
    job = relationship("Job", back_populates="offers")
    genie = relationship("User", back_populates="offers")
