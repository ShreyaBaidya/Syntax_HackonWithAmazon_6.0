from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.product import ProductSearchResponse
from app.services.catalog import search_products, get_catalog_stats, get_products_by_ids
from app.services.profile_service import get_exclusion_set
from app.services.recommendation import find_alternatives

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
    user_id: Optional[str] = Query(
        default=None,
        description="User ID for dietary profile filtering",
    ),
):
    exclusion_set = get_exclusion_set(user_id)
    products = search_products(query=q, category=category, limit=limit, exclusion_set=exclusion_set)
    return {"products": products, "total": len(products)}


@router.get("/products/{product_id}/alternatives")
async def get_product_alternatives(
    product_id: str,
    user_id: Optional[str] = Query(default=None),
):
    """Get safe alternative products for a given product based on user's dietary profile."""
    products = get_products_by_ids([product_id])
    if not products:
        raise HTTPException(status_code=404, detail="Product not found")

    product = products[0]
    exclusion_set = get_exclusion_set(user_id) if user_id else set()

    if not exclusion_set:
        return {"alternatives": []}

    # Get safe products from the same category to use as potential alternatives
    safe_products = search_products(
        query="", category=product.get("category"), limit=20, exclusion_set=exclusion_set
    )

    alternatives = find_alternatives([product], exclusion_set, safe_products)
    return {"alternatives": alternatives}
