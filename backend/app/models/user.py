from sqlalchemy import Column, String, DateTime, text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String, nullable=False)
    role = Column(String, nullable=False, server_default="user")
    reward_points = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("now()"))
    
    # Relationships
    genie_profile = relationship("Genie", back_populates="user", uselist=False)
    posted_jobs = relationship("Job", foreign_keys="Job.user_id", back_populates="user")
    assigned_jobs = relationship("Job", foreign_keys="Job.assigned_genie", back_populates="genie")
    offers = relationship("Offer", back_populates="genie")
    wallet = relationship("Wallet", back_populates="user", uselist=False)
    given_ratings = relationship("Rating", foreign_keys="Rating.reviewer_id", back_populates="reviewer")
    received_ratings = relationship("Rating", foreign_keys="Rating.reviewee_id", back_populates="reviewee")
    complaints_filed = relationship("Complaint", foreign_keys="Complaint.complainant_id", back_populates="complainant")
