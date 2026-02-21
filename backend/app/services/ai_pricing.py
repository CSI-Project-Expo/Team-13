from typing import Dict, List, Optional
from decimal import Decimal
import logging
import re

logger = logging.getLogger(__name__)


class AIPricingService:
    """
    Placeholder AI service for intelligent job pricing recommendations.
    In production, this would integrate with actual AI/ML models.
    """
    
    def __init__(self):
        # Base pricing rates per hour (in USD)
        self.base_rates = {
            "cleaning": Decimal("15.00"),
            "plumbing": Decimal("45.00"),
            "electrical": Decimal("55.00"),
            "carpentry": Decimal("40.00"),
            "painting": Decimal("25.00"),
            "gardening": Decimal("20.00"),
            "moving": Decimal("35.00"),
            "delivery": Decimal("30.00"),
            "tutoring": Decimal("30.00"),
            "pet_care": Decimal("18.00"),
            "tech_support": Decimal("50.00"),
            "general": Decimal("25.00")
        }
        
        # Multipliers based on job complexity keywords
        self.complexity_multipliers = {
            "urgent": Decimal("1.5"),
            "emergency": Decimal("2.0"),
            "complex": Decimal("1.3"),
            "expert": Decimal("1.4"),
            "specialized": Decimal("1.5"),
            "large": Decimal("1.2"),
            "multiple": Decimal("1.25"),
            "heavy": Decimal("1.3")
        }
        
        # Location-based multipliers (placeholder data)
        self.location_multipliers = {
            "new york": Decimal("1.5"),
            "san francisco": Decimal("1.6"),
            "los angeles": Decimal("1.4"),
            "chicago": Decimal("1.2"),
            "boston": Decimal("1.3"),
            "seattle": Decimal("1.25"),
            "austin": Decimal("1.1"),
            "miami": Decimal("1.15"),
            "default": Decimal("1.0")
        }
    
    def extract_job_category(self, title: str, description: str) -> str:
        """Extract job category from title and description"""
        text = (title + " " + description).lower()
        
        # Category keywords mapping
        category_keywords = {
            "cleaning": ["clean", "maid", "janitor", "housekeeping", "tidy"],
            "plumbing": ["plumb", "pipe", "drain", "sink", "toilet", "faucet"],
            "electrical": ["electric", "wire", "outlet", "switch", "circuit", "breaker"],
            "carpentry": ["wood", "carpenter", "furniture", "cabinet", "shelf"],
            "painting": ["paint", "wall", "color", "coat", "primer"],
            "gardening": ["garden", "lawn", "yard", "mow", "landscape", "tree"],
            "moving": ["move", "relocate", "pack", "unpack", "furniture"],
            "delivery": ["deliver", "transport", "pickup", "drop off"],
            "tutoring": ["tutor", "teach", "lesson", "study", "homework"],
            "pet_care": ["pet", "dog", "cat", "walk", "sitting", "grooming"],
            "tech_support": ["computer", "laptop", "tech", "software", "hardware", "it"]
        }
        
        # Find best matching category
        for category, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category
        
        return "general"
    
    def extract_duration_hours(self, duration: str) -> float:
        """Extract estimated duration in hours from duration string"""
        if not duration:
            return 2.0  # Default 2 hours
        
        duration = duration.lower()
        
        # Look for hour patterns
        hour_match = re.search(r'(\d+(?:\.\d+)?)\s*hour', duration)
        if hour_match:
            return float(hour_match.group(1))
        
        # Look for minute patterns
        minute_match = re.search(r'(\d+)\s*minute', duration)
        if minute_match:
            return float(minute_match.group(1)) / 60
        
        # Default estimates based on keywords
        if any(word in duration for word in ["quick", "small", "minor"]):
            return 1.0
        elif any(word in duration for word in ["large", "big", "major"]):
            return 4.0
        elif any(word in duration for word in ["full day", "all day"]):
            return 8.0
        
        return 2.0  # Default
    
    def calculate_complexity_multiplier(self, title: str, description: str) -> Decimal:
        """Calculate complexity multiplier based on job description"""
        text = (title + " " + description).lower()
        
        multiplier = Decimal("1.0")
        
        for keyword, mult in self.complexity_multipliers.items():
            if keyword in text:
                multiplier = max(multiplier, mult)
        
        return multiplier
    
    def calculate_location_multiplier(self, location: str) -> Decimal:
        """Calculate location-based price multiplier"""
        if not location:
            return self.location_multipliers["default"]
        
        location = location.lower()
        
        for loc, mult in self.location_multipliers.items():
            if loc in location:
                return mult
        
        return self.location_multipliers["default"]
    
    def estimate_price(self, title: str, description: str, location: Optional[str] = None, duration: Optional[str] = None) -> Dict:
        """
        Generate AI-powered price estimate for a job
        
        Returns:
            Dict containing:
            - estimated_price: Recommended price range
            - confidence_level: How confident the AI is in the estimate
            - factors: List of factors considered
            - category: Detected job category
        """
        try:
            # Extract job characteristics
            category = self.extract_job_category(title, description)
            duration_hours = self.extract_duration_hours(duration or "")
            complexity_mult = self.calculate_complexity_multiplier(title, description)
            location_mult = self.calculate_location_multiplier(location or "")
            
            # Calculate base price
            base_rate = self.base_rates.get(category, self.base_rates["general"])
            base_price = base_rate * Decimal(str(duration_hours))
            
            # Apply multipliers
            adjusted_price = base_price * complexity_mult * location_mult
            
            # Create price range (±20%)
            lower_bound = adjusted_price * Decimal("0.8")
            upper_bound = adjusted_price * Decimal("1.2")
            
            # Round to reasonable values
            lower_bound = lower_bound.quantize(Decimal("0.01"))
            adjusted_price = adjusted_price.quantize(Decimal("0.01"))
            upper_bound = upper_bound.quantize(Decimal("0.01"))
            
            # Determine confidence level
            confidence_factors = []
            if category != "general":
                confidence_factors.append("category_identified")
            if duration and any(char.isdigit() for char in duration):
                confidence_factors.append("duration_specified")
            if location:
                confidence_factors.append("location_provided")
            
            confidence_level = len(confidence_factors) / 3.0  # Max 3 factors
            
            # Compile factors list
            factors = [
                f"Category: {category.replace('_', ' ').title()}",
                f"Duration: {duration_hours} hours",
                f"Complexity multiplier: {complexity_mult}",
                f"Location multiplier: {location_mult}"
            ]
            
            result = {
                "estimated_price": {
                    "min": float(lower_bound),
                    "recommended": float(adjusted_price),
                    "max": float(upper_bound)
                },
                "confidence_level": round(confidence_level, 2),
                "factors": factors,
                "category": category,
                "duration_hours": duration_hours
            }
            
            logger.info(f"Generated price estimate for job: {title} - ${adjusted_price}")
            return result
            
        except Exception as e:
            logger.error(f"Error generating price estimate: {e}")
            # Return fallback estimate
            return {
                "estimated_price": {
                    "min": 20.0,
                    "recommended": 25.0,
                    "max": 30.0
                },
                "confidence_level": 0.3,
                "factors": ["fallback_estimate"],
                "category": "general",
                "duration_hours": 2.0
            }
    
    def get_market_insights(self, category: Optional[str] = None, location: Optional[str] = None) -> Dict:
        """
        Get market insights for pricing trends
        Placeholder implementation
        """
        # Placeholder market data
        market_data = {
            "average_prices": {
                "cleaning": {"min": 15, "avg": 25, "max": 40},
                "plumbing": {"min": 40, "avg": 60, "max": 100},
                "electrical": {"min": 50, "avg": 75, "max": 120},
                "general": {"min": 20, "avg": 30, "max": 50}
            },
            "demand_levels": {
                "cleaning": "high",
                "plumbing": "medium",
                "electrical": "high",
                "general": "medium"
            },
            "seasonal_trends": {
                "cleaning": "higher_in_spring",
                "gardening": "higher_in_summer",
                "moving": "higher_in_summer",
                "heating": "higher_in_winter"
            }
        }
        
        if category:
            avg_price = market_data["average_prices"].get(category, market_data["average_prices"]["general"])
            demand = market_data["demand_levels"].get(category, "medium")
            
            return {
                "category": category,
                "average_price": avg_price,
                "demand_level": demand,
                "market_insight": f"Current demand for {category} jobs is {demand}"
            }
        
        return market_data


# Singleton instance
ai_pricing_service = AIPricingService()
