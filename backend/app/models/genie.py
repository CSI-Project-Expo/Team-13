from sqlalchemy import Column, String, Boolean, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

from app.database import Base


class Genie(Base):
    __tablename__ = "genies"
    
    id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    skills = Column(ARRAY(String), nullable=True)
    location = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="genie_profile")
