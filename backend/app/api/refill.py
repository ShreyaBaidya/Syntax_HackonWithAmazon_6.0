from typing import Optional, List

from fastapi import APIRouter, Query

from app.services.refill_engine import get_refill_suggestions

router = APIRouter()


@router.get(
    "/refill-suggestions",
    summary="Predictive Home Refill — LLM-optimized, deduplicated",
    description=(
        "Analyzes real purchase history to predict running-low items, then uses an "
        "LLM to:\n\n"
        "- **Deduplicate**: if two similar products appear (e.g. Amul milk + Nandini milk), "
        "pick the one the customer prefers based on frequency & value\n"
        "- **Skip cart conflicts**: if a product type is already in the current cart, exclude it\n"
        "- **AI reason**: each recommendation includes a human-readable explanation\n\n"
        "Pass `cart_items` to tell the engine what's already in the customer's cart."
    ),
    tags=["Recommendations"],
)
async def refill_suggestions(
    user_id: Optional[str] = Query(
        default=None,
        description="User ID. Uses demo customer if omitted.",
    ),
    cart_items: Optional[str] = Query(
        default=None,
        description=(
            "Comma-separated product names already in cart. "
            "Example: 'Amul Milk,Parle Oreo'. "
            "LLM will skip these categories from refill suggestions."
        ),
    ),
):
    # Parse comma-separated cart item names
    cart_item_names: list[str] = []
    if cart_items:
        cart_item_names = [name.strip() for name in cart_items.split(",") if name.strip()]

    return get_refill_suggestions(
        user_id=user_id,
        cart_item_names=cart_item_names,
    )
