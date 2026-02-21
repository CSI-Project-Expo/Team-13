from sqlalchemy import Column, String, DateTime, text, Numeric, UUID, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class JobStatus(str, enum.Enum):
    POSTED = "POSTED"
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_genie = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    location = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    status = Column(String, default="POSTED", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="posted_jobs")
    genie = relationship("User", foreign_keys=[assigned_genie], back_populates="assigned_jobs")
    offers = relationship("Offer", back_populates="job", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="job", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="job", cascade="all, delete-orphan")
