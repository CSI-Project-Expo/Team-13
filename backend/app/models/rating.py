from sqlalchemy import Column, String, Integer, UUID, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(String, nullable=True)
    
    # Relationships
    job = relationship("Job", back_populates="ratings")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="given_ratings")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="received_ratings")
