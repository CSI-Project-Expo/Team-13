from sqlalchemy import Column, String, UUID, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ENUM
import enum

from app.database import Base


class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default="gen_random_uuid()")
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    complainant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=False)
    status = Column(ENUM(ComplaintStatus), default=ComplaintStatus.OPEN, nullable=False)
    
    # Relationships
    job = relationship("Job", back_populates="complaints")
    complainant = relationship("User", back_populates="complaints_filed")
