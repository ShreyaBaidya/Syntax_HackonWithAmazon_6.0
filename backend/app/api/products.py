from typing import Optional

from fastapi import APIRouter, Query

from app.models.product import ProductSearchResponse
from app.services.catalog import search_products, get_catalog_stats

router = APIRouter()


@router.get(
    "/catalog/stats",
    summary="Catalog statistics — total & per-category counts",
    description=(
        "Returns the total product count, in-stock count, out-of-stock count, "
        "a per-category breakdown (sorted by size), and the source split "
        "(Amazon Now JSON vs curated mocks)."
    ),
    response_description="Catalog stats object",
    tags=["Products"],
)
async def catalog_stats():
    return get_catalog_stats()


_CATEGORY_CHOICES = (
    "fresh | dairy | beverages | snacks | grocery | "
    "personal_care | cleaning | medicine | baby | home | electronics | fashion"
)


@router.get(
    "/products",
    response_model=ProductSearchResponse
)
async def search(
    q: str = Query(
        default="",
        description="Free-text search — matched against product name, tags, and category",
        openapi_examples={
            "tomato": {"summary": "Search by name", "value": "tomato"},
            "maggi":  {"summary": "Brand search",   "value": "maggi"},
            "fever":  {"summary": "Symptom search",  "value": "fever"},
        },
    ),
    category: Optional[str] = Query(
        default=None,
        description=f"Internal category slug. One of: {_CATEGORY_CHOICES}",
        openapi_examples={
            "fresh":         {"summary": "Fresh produce & meats",  "value": "fresh"},
            "snacks":        {"summary": "Snacks & confectionery", "value": "snacks"},
            "dairy":         {"summary": "Dairy, bread & eggs",    "value": "dairy"},
            "beverages":     {"summary": "Drinks",                 "value": "beverages"},
            "grocery":       {"summary": "Cooking essentials",     "value": "grocery"},
            "personal_care": {"summary": "Hygiene & grooming",     "value": "personal_care"},
            "cleaning":      {"summary": "Home & cleaning",        "value": "cleaning"},
            "medicine":      {"summary": "Health & medicine",      "value": "medicine"},
        },
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Maximum results to return (1–50)",
    ),
):
    products = search_products(query=q, category=category, limit=limit)
    return {"products": products, "total": len(products)}
