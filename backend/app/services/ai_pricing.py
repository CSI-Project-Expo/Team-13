from typing import Dict, Optional
from decimal import Decimal
import logging
import re

logger = logging.getLogger(__name__)


class AIPricingService:
    """
    Rule-based intelligent job pricing service (INR-based).
    Designed for Indian marketplace context.
    """

    def __init__(self):
        # Base pricing rates per hour (INR)
        self.base_rates = {
            "cleaning": Decimal("300.00"),
            "plumbing": Decimal("700.00"),
            "electrical": Decimal("800.00"),
            "carpentry": Decimal("650.00"),
            "painting": Decimal("450.00"),
            "gardening": Decimal("350.00"),
            "moving": Decimal("600.00"),
            "delivery": Decimal("250.00"),
            "tutoring": Decimal("500.00"),
            "pet_care": Decimal("300.00"),
            "tech_support": Decimal("900.00"),
            "general": Decimal("400.00")
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

        # Indian city-based multipliers
        self.location_multipliers = {
            "bangalore": Decimal("1.2"),
            "bengaluru": Decimal("1.2"),
            "mumbai": Decimal("1.3"),
            "delhi": Decimal("1.25"),
            "hyderabad": Decimal("1.15"),
            "chennai": Decimal("1.1"),
            "kolkata": Decimal("1.1"),
            "pune": Decimal("1.15"),
            "mangalore": Decimal("1.05"),
            "mangaluru": Decimal("1.05"),
            "udupi": Decimal("1.0"),
            "karkala": Decimal("0.95"),
            "default": Decimal("1.0")
        }

    def extract_job_category(self, title: str, description: str) -> str:
        text = (title + " " + description).lower()

        category_keywords = {
            "cleaning": ["clean", "maid", "janitor", "housekeeping", "tidy"],
            "plumbing": ["plumb", "pipe", "drain", "sink", "toilet", "faucet"],
            "electrical": ["electric", "wire", "outlet", "switch", "circuit", "breaker"],
            "carpentry": ["wood", "carpenter", "furniture", "cabinet", "shelf"],
            "painting": ["paint", "wall", "color", "coat", "primer"],
            "gardening": ["garden", "lawn", "yard", "mow", "landscape", "tree"],
            "moving": ["move", "relocate", "pack", "unpack", "furniture"],
            "delivery": ["deliver", "transport", "pickup", "drop"],
            "tutoring": ["tutor", "teach", "lesson", "study", "homework"],
            "pet_care": ["pet", "dog", "cat", "walk", "sitting", "grooming"],
            "tech_support": ["computer", "laptop", "tech", "software", "hardware", "it"]
        }

        for category, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                return category

        return "general"

    def extract_duration_hours(self, duration: str) -> float:
        if not duration:
            return 2.0

        duration = duration.lower()

        hour_match = re.search(r'(\d+(?:\.\d+)?)\s*hour', duration)
        if hour_match:
            return float(hour_match.group(1))

        minute_match = re.search(r'(\d+)\s*minute', duration)
        if minute_match:
            return float(minute_match.group(1)) / 60

        if "full day" in duration or "all day" in duration:
            return 8.0

        if any(word in duration for word in ["quick", "small", "minor"]):
            return 1.0

        if any(word in duration for word in ["large", "major", "big"]):
            return 4.0

        return 2.0

    def calculate_complexity_multiplier(self, title: str, description: str) -> Decimal:
        text = (title + " " + description).lower()
        multiplier = Decimal("1.0")

        for keyword, mult in self.complexity_multipliers.items():
            if keyword in text:
                multiplier = max(multiplier, mult)

        return multiplier

    def calculate_location_multiplier(self, location: str) -> Decimal:
        if not location:
            return self.location_multipliers["default"]

        location = location.lower()

        for loc, mult in self.location_multipliers.items():
            if loc in location:
                return mult

        return self.location_multipliers["default"]

    def estimate_price(
        self,
        title: str,
        description: str,
        location: Optional[str] = None,
        duration: Optional[str] = None
    ) -> Dict:

        try:
            category = self.extract_job_category(title, description)
            duration_hours = self.extract_duration_hours(duration or "")
            complexity_mult = self.calculate_complexity_multiplier(title, description)
            location_mult = self.calculate_location_multiplier(location or "")

            base_rate = self.base_rates.get(category, self.base_rates["general"])
            base_price = base_rate * Decimal(str(duration_hours))

            adjusted_price = base_price * complexity_mult * location_mult

            lower_bound = (adjusted_price * Decimal("0.8")).quantize(Decimal("0.01"))
            adjusted_price = adjusted_price.quantize(Decimal("0.01"))
            upper_bound = (adjusted_price * Decimal("1.2")).quantize(Decimal("0.01"))

            confidence_factors = []
            if category != "general":
                confidence_factors.append("category_identified")
            if duration and any(char.isdigit() for char in duration):
                confidence_factors.append("duration_specified")
            if location:
                confidence_factors.append("location_provided")

            confidence_level = round(len(confidence_factors) / 3.0, 2)

            result = {
                "estimated_price": {
                    "min": float(lower_bound),
                    "recommended": float(adjusted_price),
                    "max": float(upper_bound)
                },
                "confidence_level": confidence_level,
                "category": category,
                "duration_hours": duration_hours,
                "factors": [
                    f"Category: {category}",
                    f"Duration: {duration_hours} hours",
                    f"Complexity multiplier: {complexity_mult}",
                    f"Location multiplier: {location_mult}"
                ]
            }

            logger.info(f"Generated price estimate for job: {title} - ₹{adjusted_price}")
            return result

        except Exception as e:
            logger.error(f"Error generating price estimate: {e}")
            return {
                "estimated_price": {
                    "min": 500.0,
                    "recommended": 800.0,
                    "max": 1200.0
                },
                "confidence_level": 0.3,
                "category": "general",
                "duration_hours": 2.0,
                "factors": ["fallback_estimate"]
            }


# Singleton instance
ai_pricing_service = AIPricingService()