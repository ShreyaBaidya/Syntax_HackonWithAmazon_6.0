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
from app.db.food_catalog import FOOD_ENHANCED_PRODUCTS
from app.services.profile_service import filter_products

# Amazon products receive higher priority in sequential in-memory search.
# Enhanced food catalog provides 200+ structured food products with ingredients/dietary metadata.
ALL_PRODUCTS: list[dict] = AMAZON_PRODUCTS + FOOD_ENHANCED_PRODUCTS + PRODUCTS


import re


def _has_word(text: str, words: list[str]) -> bool:
    """Check if any of the given words appears as a whole word in text (case-insensitive)."""
    if not text:
        return False
    for w in words:
        if re.search(rf"\b{re.escape(w)}\b", text, re.IGNORECASE):
            return True
    return False


def _infer_dietary_tags(p: dict) -> list[str]:
    """Infer dietary tags for legacy products that don't have structured metadata.
    Only applies to food-related categories — non-food items get no dietary tags.

    Notes on correctness:
    - In the Indian dietary context (which this app targets), EGGS are NOT considered
      vegetarian. They're classified separately ("eggetarian"/ovo). We therefore
      treat egg as a non-vegetarian indicator.
    - We match against the product NAME using word boundaries. The `tags` string
      is polluted by category names like "Dairy and Eggs" so we can't use it.
    """
    if p.get("dietary_tags"):
        return p["dietary_tags"]

    # Only infer for food categories
    FOOD_CATEGORIES = {
        "fruits",
        "vegetables",
        "fresh",
        "dairy",
        "beverages",
        "snacks",
        "grocery",
        "breakfast",
        "plant_based",
        "high_protein",
        "allergy_friendly",
        "ready_to_eat",
        "medicine",
    }
    category = p.get("category", "")
    if category not in FOOD_CATEGORIES:
        return []

    name = p.get("name", "")
    inferred: list[str] = []

    # Non-vegetarian indicators (egg is non-veg in the Indian context this app serves)
    non_veg_keywords = [
        "chicken",
        "mutton",
        "pork",
        "fish",
        "prawn",
        "shrimp",
        "meat",
        "egg",
        "eggs",
        "quail",
    ]
    has_egg = _has_word(name, ["egg", "eggs", "quail"])
    has_meat = _has_word(
        name, ["chicken", "mutton", "pork", "fish", "prawn", "shrimp", "meat"]
    )
    is_non_veg = has_egg or has_meat

    if not is_non_veg:
        inferred.append("Vegetarian")
    elif has_egg and not has_meat:
        # Tag egg-only products explicitly so users know what they're looking at
        inferred.append("Contains Egg")

    # Vegan check (must be vegetarian AND no animal-derived ingredients)
    dairy_animal_keywords = [
        "milk",
        "dairy",
        "butter",
        "cheese",
        "yogurt",
        "curd",
        "honey",
        "cream",
        "paneer",
        "ghee",
        "lactose",
        "khoa",
        "khoya",
        "dahi",
    ]
    if "Vegetarian" in inferred and not _has_word(name, dairy_animal_keywords):
        inferred.append("Vegan")

    # Category-based positive inferences for clearly-vegan categories
    if category in ("fruits", "vegetables", "fresh"):
        if "Vegetarian" not in inferred:
            inferred.append("Vegetarian")
        if "Vegan" not in inferred:
            inferred.append("Vegan")
        if "Gluten-Free" not in inferred:
            inferred.append("Gluten-Free")

    # Gluten-free check (against name only — tags are polluted by category)
    gluten_keywords = [
        "wheat",
        "bread",
        "flour",
        "atta",
        "maida",
        "noodles",
        "pasta",
        "biscuit",
        "biscuits",
        "cookie",
        "cookies",
        "rusk",
    ]
    if not _has_word(name, gluten_keywords):
        if "Gluten-Free" not in inferred:
            inferred.append("Gluten-Free")

    return inferred[:3]  # Limit to 3 tags


def _format(p: dict) -> dict:
    dietary = p.get("dietary_tags", []) or _infer_dietary_tags(p)
    return {
        "id": p.get("id", ""),
        "name": p.get("name", ""),
        "price": float(p.get("price", 0)),
        "mrp": float(p.get("mrp", p.get("price", 0))),
        "discount_percent": int(p.get("discount_percent", 0)),
        "unit": p.get("unit", "piece"),
        "image_url": p.get("image_url", ""),
        "eta_min": int(p.get("eta_min", 30)),
        "category": p.get("category", ""),
        "tags": p.get("tags", ""),
        "in_stock": bool(p.get("in_stock", True)),
        "ingredients": p.get("ingredients", []),
        "dietary_tags": dietary,
        "allergen_tags": p.get("allergen_tags", []),
        "nutrition_summary": p.get("nutrition_summary", None),
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
        "in_stock": in_stock_count,
        "out_of_stock": len(ALL_PRODUCTS) - in_stock_count,
        "by_category": dict(sorted(by_category.items(), key=lambda x: -x[1])),
        "sources": {
            "amazon_now_json": len(AMAZON_PRODUCTS),
            "curated_mock": len(PRODUCTS),
        },
    }


def search_products(
    query: str,
    category: str | None = None,
    limit: int = 5,
    exclusion_set: set | None = None,
    name_only: bool = False,
) -> list[dict]:
    """
    Search the product catalog.
    Attempts DynamoDB; silently falls back to in-memory data.
    When exclusion_set is provided, fetches extra results and filters.
    """
    # Determine internal fetch limit
    fetch_limit = limit * 2 if exclusion_set else limit

    try:
        from app.db.dynamo import search_products_by_query, search_products_by_category

        if category and query:
            # Fetch broader set from category, then filter by query in-memory
            # DynamoDB category search ignores query — we post-filter here
            raw = search_products_by_category(category, max(fetch_limit * 5, 50))
            if raw and query:
                q_lower = query.lower()
                words = [w for w in q_lower.split() if len(w) >= 3]
                filtered = [
                    p for p in raw
                    if q_lower in (p.get("name", "") + " " + p.get("tags", "")).lower()
                    or any(w in (p.get("name", "") + " " + p.get("tags", "")).lower() for w in words)
                ]
                results = filtered if filtered else None
            else:
                results = raw if raw else None
        elif category:
            results = search_products_by_category(category, fetch_limit)
        else:
            results = search_products_by_query(query, fetch_limit)
        if results:
            formatted = [_format(p) for p in results[:fetch_limit]]
            # Validate results contain at least one query word — DynamoDB full-text search
            # sometimes returns completely unrelated products (embedding/index mismatch).
            if query:
                q_words = [w for w in query.lower().split() if len(w) >= 3]
                validated = [
                    p for p in formatted
                    if not q_words or any(
                        w in (p.get("name", "") + " " + p.get("category", "")).lower()
                        for w in q_words
                    )
                ]
                if validated:
                    if exclusion_set:
                        validated = filter_products(validated, exclusion_set)
                    return validated[:limit]
                # DynamoDB returned irrelevant results — fall through to in-memory
            else:
                if exclusion_set:
                    formatted = filter_products(formatted, exclusion_set)
                return formatted[:limit]
    except Exception:
        pass  # DynamoDB unavailable — fall through to in-memory

    results = _search_memory(query, category, fetch_limit, name_only=name_only)

    if exclusion_set:
        results = filter_products(results, exclusion_set)

    return results[:limit]


def _search_memory(query: str, category: str | None, limit: int, name_only: bool = False) -> list[dict]:
    q = query.lower() if query else ""
    stop_words = {
        "for",
        "the",
        "and",
        "with",
        "group",
        "some",
        "need",
        "want",
        "make",
        "can",
        "you",
        "please",
    }
    words = [w for w in q.split() if len(w) >= 3 and w not in stop_words]
    scored: list[tuple[int, dict]] = []
    for p in ALL_PRODUCTS:
        if not p.get("in_stock"):
            continue
        if category and p.get("category") != category:
            continue
        if q:
            name = p.get("name", "").lower()
            cat = p.get("category", "").lower()
            if name_only:
                searchable = name
            else:
                searchable = f"{name} {p.get('tags', '')} {cat}".lower()
            if q in searchable:
                scored.append((len(words) + 1, _format(p)))  # exact phrase — highest score
            elif words:
                match_count = sum(1 for w in words if w in searchable)
                if match_count > 0:
                    scored.append((match_count, _format(p)))
        else:
            scored.append((0, _format(p)))

    # Sort by match score descending so best matches come first
    scored.sort(key=lambda x: -x[0])
    out = [item for _, item in scored]

    # Category-only fallback: only when no query was given
    if not out and category and not q:
        out = [
            _format(p)
            for p in ALL_PRODUCTS
            if p.get("in_stock") and p.get("category") == category
        ]

    # Last resort: return top in-stock products (safety net, only when no query)
    if not out and not q:
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
