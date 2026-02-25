from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.job import Job
from app.services.embedding_service import generate_embedding
# from app.services.ai_pricing import ai_pricing_service  # Optional fallback


async def suggest_price(
    session: AsyncSession,
    title: str,
    description: str,
    location: str | None
):
    # 1️⃣ Combine text
    combined_text = f"{title} {description} {location or ''}"

    # 2️⃣ Generate embedding
    embedding = generate_embedding(combined_text)

    # 3️⃣ Query top 10 similar jobs WITH distance
    stmt = (
        select(
            Job.price,
            Job.embedding.l2_distance(embedding).label("distance")
        )
        .where(
            Job.status == "COMPLETED",
            Job.embedding.is_not(None),
            Job.location == location
        )
        .order_by(Job.embedding.l2_distance(embedding))
        .limit(10)
    )

    result = await session.execute(stmt)
    rows = result.all()

    # 4️⃣ Apply similarity threshold
    SIMILARITY_THRESHOLD = 1.2  # Tune if needed

    filtered_prices = [
        float(row.price)
        for row in rows
        if row.price is not None
        and row.distance is not None
        and row.distance < SIMILARITY_THRESHOLD
    ]

    # 5️⃣ If insufficient similar jobs → safe fallback
    if len(filtered_prices) < 3:
        return {
            "suggested_range": None,
            "based_on": len(filtered_prices),
            "min_price": None,
            "max_price": None,
            "reasoning": "Insufficient similar historical data.",
            "message": "Not enough similar completed jobs found."
        }

        # 🔁 OPTIONAL: Rule-based fallback instead of null
        # fallback = ai_pricing_service.estimate_price(
        #     title=title,
        #     description=description,
        #     location=location
        # )
        # return {
        #     "source": "fallback_rule_based",
        #     **fallback
        # }

    # 6️⃣ Compute range
    min_price = min(filtered_prices)
    max_price = max(filtered_prices)
    avg_price = sum(filtered_prices) / len(filtered_prices)

    return {
        "suggested_range": {
            "min": round(min_price, 2),
            "avg": round(avg_price, 2),
            "max": round(max_price, 2)
        },
        "based_on": len(filtered_prices),
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "reasoning": f"Based on {len(filtered_prices)} highly similar completed jobs."
    }