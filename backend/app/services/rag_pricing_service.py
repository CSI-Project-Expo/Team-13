from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ai_pricing import ai_pricing_service


async def suggest_price(
    session: AsyncSession,
    title: str,
    description: str,
    location: str | None
):
    _ = session
    pricing_result = ai_pricing_service.estimate_price(
        title=title,
        description=description,
        location=location,
    )
    estimated_price = pricing_result.get("estimated_price", {})
    min_price = estimated_price.get("min")
    recommended_price = estimated_price.get("recommended")
    max_price = estimated_price.get("max")

    confidence_level = pricing_result.get("confidence_level")
    confidence_text = (
        f" Confidence: {int(confidence_level * 100)}%."
        if isinstance(confidence_level, (int, float))
        else ""
    )

    return {
        "suggested_range": {
            "min": min_price,
            "avg": recommended_price,
            "max": max_price,
        },
        "based_on": None,
        "min_price": min_price,
        "max_price": max_price,
        "reasoning": f"AI estimate based on job details, duration, and location.{confidence_text}",
        "confidence_level": confidence_level,
    }