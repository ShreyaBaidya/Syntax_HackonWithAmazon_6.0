from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.cart import (
    IntentRequest,
    CartResponse,
    URLPromptRequest,
    OccasionRequest,
    OutcomeRequest,
    BudgetTier,
    CartItem,
    ItemCategory,
)
from app.agents.intent_agent import intent_agent
from app.agents.product_agent import product_agent
from app.agents.nutrition_agent import nutrition_agent
from app.agents.vision_agent import vision_agent
from app.agents.recipe_agent import recipe_agent
from app.services.catalog import search_products
import base64


def _map_to_catalog(items: list[CartItem]) -> list[CartItem]:
    mapped_items = []
    for item in items:
        # Avoid passing raw AI categories directly to our search filters as they might not match
        results = search_products(query=item.name, limit=1)
        print(
            f"DEBUG _map_to_catalog: query='{item.name}' results={bool(results)}",
            flush=True,
        )
        if results:
            real = results[0]
            print(f"DEBUG _map_to_catalog: found id={real.get('id')}", flush=True)
            # In Pydantic v2, it is safer to create a new copy with updated fields
            updated_item = item.copy(
                update={
                    "id": real.get("id"),
                    "name": real.get("name"),
                    "price": real.get("price"),
                    "estimated_price": real.get("price"),
                    "image_url": real.get("image_url"),
                }
            )
            mapped_items.append(updated_item)
        else:
            # Keep AI item as fallback if not in catalog
            mapped_items.append(item)
    return mapped_items


router = APIRouter(prefix="/api/v1", tags=["cart"])


@router.post("/cart/intent", response_model=CartResponse)
async def build_cart_from_intent(request: IntentRequest):
    """Build a shopping cart from natural language intent."""
    intent_data = await intent_agent.classify_intent(request.query)
    items = await product_agent.build_cart_from_intent(
        intent_data=intent_data,
        query=request.query,
        budget_tier=request.budget_tier,
        dietary_preferences=request.dietary_preferences,
    )
    if not items:
        raise HTTPException(
            status_code=422, detail="Could not generate cart from the given intent"
        )
    nutrition = await nutrition_agent.analyze_nutrition(items)
    total_price = sum(item.estimated_price for item in items if item.estimated_price)
    return CartResponse(
        intent=request.query,
        description=f"Shopping cart for: {request.query}",
        items=items,
        total_estimated_price=round(total_price, 2),
        nutrition=nutrition,
        budget_tier=request.budget_tier,
    )


@router.post("/cart/image", response_model=CartResponse)
async def build_cart_from_image(file: UploadFile = File(...)):
    """Build a shopping cart from an uploaded image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    contents = await file.read()
    image_base64 = base64.b64encode(contents).decode("utf-8")
    items = await vision_agent.image_to_cart(image_base64)
    if not items:
        raise HTTPException(status_code=422, detail="Could not detect items from image")
    items = _map_to_catalog(items)
    nutrition = await nutrition_agent.analyze_nutrition(items)
    total_price = sum(item.estimated_price for item in items if item.estimated_price)
    return CartResponse(
        intent="Image-based shopping",
        description="Shopping cart generated from uploaded image",
        items=items,
        total_estimated_price=round(total_price, 2),
        nutrition=nutrition,
        budget_tier=BudgetTier.STANDARD,
    )


@router.post("/cart/url", response_model=CartResponse)
async def build_cart_from_url(request: URLPromptRequest):
    """Build a shopping cart from any URL with an optional custom prompt."""
    items = await recipe_agent.url_to_cart(
        url=request.url, prompt=request.prompt, budget_tier=request.budget_tier
    )
    if not items:
        raise HTTPException(
            status_code=422, detail="Could not extract products from URL"
        )
    nutrition = await nutrition_agent.analyze_nutrition(items)
    total_price = sum(item.estimated_price for item in items if item.estimated_price)
    return CartResponse(
        intent=f"URL: {request.url}",
        description=f"Shopping cart from: {request.url}",
        items=items,
        total_estimated_price=round(total_price, 2),
        nutrition=nutrition,
        budget_tier=request.budget_tier,
    )


@router.post("/cart/occasion", response_model=CartResponse)
async def build_cart_for_occasion(request: OccasionRequest):
    """Build a shopping cart for a specific occasion."""
    items = await product_agent.get_occasion_cart(
        occasion=request.occasion.value,
        guests=request.guests,
        budget_tier=request.budget_tier,
        dietary_preferences=request.dietary_preferences,
    )
    if not items:
        raise HTTPException(status_code=422, detail="Could not generate occasion cart")
    items = _map_to_catalog(items)
    nutrition = await nutrition_agent.analyze_nutrition(items)
    total_price = sum(item.estimated_price for item in items if item.estimated_price)
    return CartResponse(
        intent=f"Occasion: {request.occasion.value.replace('_', ' ').title()}",
        description=f"Shopping cart for {request.occasion.value.replace('_', ' ')} with {request.guests} guests",
        items=items,
        total_estimated_price=round(total_price, 2),
        nutrition=nutrition,
        budget_tier=request.budget_tier,
    )


@router.post("/cart/outcome", response_model=CartResponse)
async def build_cart_for_outcome(request: OutcomeRequest):
    """Build a shopping cart based on a health/lifestyle outcome goal."""
    items = await product_agent.get_outcome_cart(
        goal=request.goal,
        budget_tier=request.budget_tier,
        dietary_preferences=request.dietary_preferences,
    )
    if not items:
        raise HTTPException(status_code=422, detail="Could not generate outcome cart")
    items = _map_to_catalog(items)
    nutrition = await nutrition_agent.analyze_nutrition(items)
    total_price = sum(item.estimated_price for item in items if item.estimated_price)
    return CartResponse(
        intent=f"Goal: {request.goal}",
        description=f"Shopping cart to help with: {request.goal}",
        items=items,
        total_estimated_price=round(total_price, 2),
        nutrition=nutrition,
        budget_tier=request.budget_tier,
    )


@router.get("/occasions")
async def get_occasions():
    return {
        "occasions": [
            {
                "id": "sick_day",
                "name": "Sick Day",
                "icon": "🤒",
                "description": "Feel better food & remedies",
            },
            {
                "id": "game_night",
                "name": "Game Night",
                "icon": "🎮",
                "description": "Snacks & drinks for gaming",
            },
            {
                "id": "movie_night",
                "name": "Movie Night",
                "icon": "🎬",
                "description": "Popcorn, snacks & treats",
            },
            {
                "id": "house_party",
                "name": "House Party",
                "icon": "🎉",
                "description": "Party food & beverages",
            },
            {
                "id": "birthday",
                "name": "Birthday",
                "icon": "🎂",
                "description": "Cake ingredients & party food",
            },
            {
                "id": "date_night",
                "name": "Date Night",
                "icon": "💕",
                "description": "Romantic dinner ingredients",
            },
            {
                "id": "office_lunch",
                "name": "Office Lunch",
                "icon": "💼",
                "description": "Quick & professional meals",
            },
            {
                "id": "quick_breakfast",
                "name": "Quick Breakfast",
                "icon": "☀️",
                "description": "Fast morning meals",
            },
        ]
    }
