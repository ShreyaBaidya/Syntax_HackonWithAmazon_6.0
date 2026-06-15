from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    unit: str
    image_url: str
    eta_min: int = 28
    in_stock: bool = True
    tags: str = ""
    reason: Optional[str] = None


class ProductCard(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "z0001",
                "name": "Onion",
                "price": 21.0,
                "mrp": 25.0,
                "discount_percent": 16,
                "unit": "1kg",
                "image_url": "https://placehold.co/200x200/FEFCE8/A16207?text=Onion",
                "eta_min": 35,
                "category": "fresh",
                "tags": "onion vegetable cooking fresh produce",
                "in_stock": True,
                "reason": None,
            }
        }
    )

    id: str
    name: str
    price: float
    mrp: float = 0.0
    discount_percent: int = 0
    unit: str
    image_url: str
    eta_min: int
    category: str
    tags: str = ""
    in_stock: bool = True
    reason: Optional[str] = None
    ingredients: List[str] = []
    dietary_tags: List[str] = []
    allergen_tags: List[str] = []
    nutrition_summary: Optional[Dict[str, Any]] = None


class ProductSearchResponse(BaseModel):
    """Response envelope returned by GET /api/v1/products"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "products": [
                    {
                        "id": "z0001",
                        "name": "Onion",
                        "price": 21.0,
                        "unit": "1kg",
                        "image_url": "https://placehold.co/200x200/FEFCE8/A16207?text=Onion",
                        "eta_min": 35,
                        "category": "fresh",
                    },
                    {
                        "id": "z0002",
                        "name": "Tomato Hybrid",
                        "price": 35.0,
                        "unit": "1kg",
                        "image_url": "https://placehold.co/200x200/FEFCE8/A16207?text=Tomato+Hybrid",
                        "eta_min": 35,
                        "category": "fresh",
                    },
                ],
                "total": 2,
            }
        }
    )

    products: List[ProductCard]
    total: int


class RecommendationsResponse(BaseModel):
    """Response returned by GET /api/v1/recommendations"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "time_context": "afternoon",
                "now_suggestions": [
                    {
                        "id": "p006",
                        "name": "Nescafé Classic Instant Coffee 200g",
                        "price": 189.0,
                        "unit": "jar",
                        "image_url": "https://placehold.co/200x200/FFF7ED/EA580C?text=Nescafe",
                        "eta_min": 22,
                        "category": "beverages",
                        "reason": "Afternoon pick-me-up ☕",
                    }
                ],
                "reorder_nudges": [],
                "trending": [
                    {
                        "id": "z2609",
                        "name": "Dukes Waffy Chocolate Wafers",
                        "price": 22.0,
                        "unit": "pack of 75",
                        "image_url": "https://placehold.co/200x200/FEFCE8/CA8A04?text=Dukes+Waffy+Chocol",
                        "eta_min": 20,
                        "category": "snacks",
                        "reason": "Trending near you 🔥",
                    }
                ],
            }
        }
    )

    time_context: str
    now_suggestions: List[ProductCard]
    reorder_nudges: List[ProductCard]
    trending: List[ProductCard]
