from sqlalchemy import Column, String, DateTime, text, Numeric, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.database import Base


class GenieLocation(Base):
    """Store live location updates from genies during active jobs"""
    __tablename__ = "genie_locations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    genie_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Location coordinates
    latitude = Column(Numeric(10, 8), nullable=False)
    longitude = Column(Numeric(11, 8), nullable=False)
    
    # Accuracy in meters (optional, from GPS)
    accuracy = Column(Numeric(6, 2), nullable=True)
    
    # Timestamp of the location update
    updated_at = Column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "job_id": str(self.job_id),
            "genie_id": str(self.genie_id),
            "latitude": float(self.latitude) if self.latitude else None,
            "longitude": float(self.longitude) if self.longitude else None,
            "accuracy": float(self.accuracy) if self.accuracy else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
