from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.cart import CartResponse, BudgetTier, CartItem
from app.agents.vision_agent import vision_agent
from app.services.catalog import search_products
import base64


def _map_to_catalog(items: list[CartItem]) -> list[CartItem]:
  """Map AI-generated items to real catalog products."""
  mapped_items = []
  for item in items:
    results = search_products(query=item.name, limit=1)
    if results:
      real = results[0]
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
      mapped_items.append(item)
  return mapped_items


router = APIRouter(prefix="/api/v1", tags=["Pantry Scanner"])


@router.post("/cart/image", response_model=CartResponse)
async def build_cart_from_image(file: UploadFile = File(...)):
  """Build cart by analyzing an uploaded image (fridge, shelf, etc)."""
  if not file.content_type or not file.content_type.startswith("image/"):
    raise HTTPException(status_code=400, detail="File must be an image")

  contents = await file.read()
  image_base64 = base64.b64encode(contents).decode("utf-8")
  items = await vision_agent.image_to_cart(image_base64)

  if not items:
    raise HTTPException(status_code=422, detail="Could not detect items from image")

  items = _map_to_catalog(items)
  total_price = sum(item.estimated_price for item in items if item.estimated_price)

  return CartResponse(
    intent="Image-based shopping",
    description="Shopping cart generated from uploaded image",
    items=items,
    total_estimated_price=round(total_price, 2),
    nutrition=None,
    budget_tier=BudgetTier.STANDARD,
  )


@router.get("/occasions")
async def get_occasions():
  """List available occasions for quick shopping bundles."""
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
