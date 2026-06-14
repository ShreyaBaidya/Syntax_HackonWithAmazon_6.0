from typing import Optional

from fastapi import APIRouter, Query

from app.models.product import RecommendationsResponse
from app.services.recommendation import get_recommendations

router = APIRouter()


@router.get(
    "/recommendations",
    response_model=RecommendationsResponse
)
async def recommendations(
    user_id: Optional[str] = Query(
        default=None,
        description="User ID for personalised reorder nudges. Omit for anonymous recommendations.",
        openapi_examples={
            "anonymous": {"summary": "Anonymous user",    "value": None},
            "known":     {"summary": "Returning user",    "value": "user-001"},
        },
    ),
    query: Optional[str] = Query(
        default=None,
        description="Search intent from NowSpeak chat to influence recommendations.",
    ),
):
    return get_recommendations(user_id=user_id, query=query)
