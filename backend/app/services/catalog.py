from __future__ import annotations
"""
Product catalog search service.
Tries DynamoDB first; falls back to in-memory data for local dev.

In-memory data merges two sources (Amazon items listed first for higher
search priority, with curated products retained as a local fallback):
  - AMAZON_PRODUCTS - products loaded from the Amazon Now JSON dataset
  - PRODUCTS        - 50 curated fallback products
"""
from app.db.seed import PRODUCTS
from app.db.amazon_catalog import AMAZON_PRODUCTS

# Amazon products receive higher priority in sequential in-memory search.
ALL_PRODUCTS: list[dict] = AMAZON_PRODUCTS + PRODUCTS


def _format(p: dict) -> dict:
    return {
        "id":               p.get("id", ""),
        "name":             p.get("name", ""),
        "price":            float(p.get("price", 0)),
        "mrp":              float(p.get("mrp", p.get("price", 0))),
        "discount_percent": int(p.get("discount_percent", 0)),
        "unit":             p.get("unit", "piece"),
        "image_url":        p.get("image_url", ""),
        "eta_min":          int(p.get("eta_min", 30)),
        "category":         p.get("category", ""),
        "tags":             p.get("tags", ""),
        "in_stock":         bool(p.get("in_stock", True)),
    }


def get_catalog_stats() -> dict:
    """Return total product count, in-stock count, and per-category breakdown."""
    by_category: dict = {}
    in_stock_count = 0

    for p in ALL_PRODUCTS:
        cat = p.get("category", "unknown")
        by_category[cat] = by_category.get(cat, 0) + 1
        if p.get("in_stock", True):
            in_stock_count += 1

    return {
        "total_products": len(ALL_PRODUCTS),
        "in_stock":       in_stock_count,
        "out_of_stock":   len(ALL_PRODUCTS) - in_stock_count,
        "by_category":    dict(sorted(by_category.items(), key=lambda x: -x[1])),
        "sources": {
            "amazon_now_json": len(AMAZON_PRODUCTS),
            "curated_mock": len(PRODUCTS),
        },
    }


def search_products(
    query: str,
    category: str | None = None,
    limit: int = 5,
) -> list[dict]:
    """
    Search the product catalog.
    Attempts DynamoDB; silently falls back to in-memory data.
    """
    try:
        from app.db.dynamo import search_products_by_query, search_products_by_category
        if category:
            results = search_products_by_category(category, limit)
            if not results and query:
                results = search_products_by_query(query, limit)
        else:
            results = search_products_by_query(query, limit)
        if results:
            return [_format(p) for p in results[:limit]]
    except Exception:
        pass  # DynamoDB unavailable — fall through to in-memory

    return _search_memory(query, category, limit)


def _search_memory(query: str, category: str | None, limit: int) -> list[dict]:
    q = query.lower() if query else ""
    out = []
    for p in ALL_PRODUCTS:
        if not p.get("in_stock"):
            continue
        if category and p.get("category") != category:
            continue
        if q and q not in p.get("name", "").lower() \
              and q not in p.get("tags", "").lower() \
              and q not in p.get("category", "").lower():
            if not category:
                continue  # skip non-matching items when no category filter
        out.append(_format(p))

    # If we still have nothing, return top in-stock products (safety net)
    if not out:
        out = [_format(p) for p in ALL_PRODUCTS if p.get("in_stock")]

    return out[:limit]


def get_products_by_ids(ids: list[str]) -> list[dict]:
    id_set = set(ids)
    return [_format(p) for p in ALL_PRODUCTS if p["id"] in id_set]


def get_trending(limit: int = 4) -> list[dict]:
    """
    Return highly rated Amazon products across distinct categories.
    Review volume breaks rating ties for a stable popularity ranking.
    """
    if not AMAZON_PRODUCTS:
        fallback_ids = ["p016", "p006", "p011", "p017"]
        return [_format(p) for p in PRODUCTS if p["id"] in fallback_ids][:limit]

    # Pick one popular item per category to keep the lane varied.
    sorted_items = sorted(
        (p for p in AMAZON_PRODUCTS if p.get("in_stock")),
        key=lambda p: (p.get("rating", 0), p.get("review_count", 0)),
        reverse=True,
    )
    seen_categories: set[str] = set()
    trending: list[dict] = []
    for p in sorted_items:
        cat = p.get("category", "")
        if cat not in seen_categories:
            seen_categories.add(cat)
            trending.append(_format(p))
        if len(trending) >= limit:
            break

    return trending
