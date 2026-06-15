from __future__ import annotations

"""
Smart Recommendations Engine.
Three lanes: Now Suggestions (time-based) · Reorder Nudges · Trending.
"""
from datetime import datetime

from app.db.seed import TIME_BASED_CATEGORIES
from app.services.catalog import ALL_PRODUCTS, _format, get_trending
from app.services.profile_service import get_exclusion_set, filter_products


# ── Alternative product mapping ──────────────────────────────────────────────
# Maps common allergen-containing product keywords to safe alternative search terms.
# Used by find_alternatives() to suggest safe replacements.
ALTERNATIVE_MAP: dict[str, list[dict]] = {
    "nut": [
        {
            "pattern": "peanut butter",
            "alt_query": "sunflower seed butter",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "almond milk",
            "alt_query": "oat milk",
            "alt_category": "plant_based",
        },
        {
            "pattern": "almond",
            "alt_query": "sunflower seeds pumpkin seeds",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "cashew",
            "alt_query": "sunflower seeds",
            "alt_category": "allergy_friendly",
        },
    ],
    "dairy": [
        {
            "pattern": "milk",
            "alt_query": "oat milk coconut milk",
            "alt_category": "plant_based",
        },
        {
            "pattern": "yogurt",
            "alt_query": "coconut yogurt",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "cheese",
            "alt_query": "dairy-free cheese",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "butter",
            "alt_query": "sunflower seed butter",
            "alt_category": "allergy_friendly",
        },
        {"pattern": "paneer", "alt_query": "tofu", "alt_category": "plant_based"},
        {
            "pattern": "cream",
            "alt_query": "coconut cream",
            "alt_category": "plant_based",
        },
    ],
    "gluten": [
        {
            "pattern": "bread",
            "alt_query": "gluten free bread",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "pasta",
            "alt_query": "rice pasta",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "flour",
            "alt_query": "gluten free atta rice flour",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "oats",
            "alt_query": "ragi jowar millet",
            "alt_category": "allergy_friendly",
        },
        {
            "pattern": "noodles",
            "alt_query": "rice pasta glass noodles",
            "alt_category": "allergy_friendly",
        },
    ],
    "soy": [
        {
            "pattern": "tofu",
            "alt_query": "paneer cottage cheese",
            "alt_category": "dairy",
        },
        {
            "pattern": "soy milk",
            "alt_query": "oat milk coconut milk",
            "alt_category": "plant_based",
        },
    ],
    "eggs": [
        {
            "pattern": "egg",
            "alt_query": "tofu scramble chickpea flour",
            "alt_category": "plant_based",
        },
    ],
}


def find_alternatives(
    filtered_products: list[dict],
    exclusion_set: set[str],
    all_safe_products: list[dict],
) -> list[dict]:
    """
    Find safe alternatives for products that were filtered out.
    Returns up to 1 alternative per filtered product.

    Args:
        filtered_products: Products that were removed by the safety filter
        exclusion_set: The user's exclusion keywords
        all_safe_products: All products that pass the user's safety filter

    Returns:
        List of alternative product dicts with 'is_alternative', 'replaces', and 'reason' fields.
    """
    from app.services.catalog import search_products as cat_search

    alternatives = []
    seen_alt_ids = set()

    for product in filtered_products[:5]:  # Limit to avoid too many lookups
        name_lower = product.get("name", "").lower()
        category = product.get("category", "")

        # Try to find an alternative using ALTERNATIVE_MAP
        alt_found = None
        for kw, mappings in ALTERNATIVE_MAP.items():
            if kw not in exclusion_set:
                continue
            for mapping in mappings:
                if mapping["pattern"].lower() in name_lower:
                    # Search for the alternative
                    results = cat_search(
                        query=mapping["alt_query"],
                        category=mapping.get("alt_category"),
                        limit=3,
                        exclusion_set=exclusion_set,
                    )
                    if results:
                        alt_found = results[0]
                        break
            if alt_found:
                break

        # Fallback: find a same-category safe product
        if not alt_found:
            for safe_p in all_safe_products:
                if (
                    safe_p.get("category") == category
                    and safe_p["id"] not in seen_alt_ids
                ):
                    alt_found = safe_p
                    break

        if alt_found and alt_found["id"] not in seen_alt_ids:
            seen_alt_ids.add(alt_found["id"])
            alt_found = dict(alt_found)  # Copy to avoid mutation
            alt_found["is_alternative"] = True
            alt_found["replaces"] = product.get("name", "Unknown")
            alt_found["reason"] = (
                f"Recommended Alternative — try instead of {product.get('name', '')}"
            )
            alternatives.append(alt_found)

    return alternatives


def _compute_reason(
    product: dict, user_profile: dict | None, intent_query: str | None
) -> str:
    """
    Generate a contextual recommendation reason for a product.
    Priority: intent > dietary match > allergen safety > nutritional > time-based > generic.
    Never returns empty or null — fallback is "Recommended for you".
    """
    # Priority 1: Intent-based reason
    if intent_query:
        return f'Based on your search: "{intent_query}" 🔍'

    if not user_profile:
        # No profile — check product properties
        diet_tags = product.get("dietary_tags", [])
        if "High-Protein" in diet_tags:
            return "High protein pick 💪"
        if "Organic" in diet_tags:
            return "Organic & natural 🌿"
        return "Recommended for you"

    # Priority 2: Dietary match
    user_diet_tags = user_profile.get("diet_tags", [])
    product_diet_tags = [t.lower() for t in product.get("dietary_tags", [])]
    for tag in user_diet_tags:
        tag_lower = tag.lower()
        if tag_lower in product_diet_tags or tag_lower.replace("-", " ") in " ".join(
            product_diet_tags
        ):
            return f"Matches your {tag} preference ✓"

    # Priority 3: Allergen safety
    user_allergens = user_profile.get("allergen_tags", [])
    if user_allergens:
        product_allergens = [a.lower() for a in product.get("allergen_tags", [])]
        if not product_allergens:
            allergen_names = ", ".join(user_allergens[:2])
            return f"Safe for your {allergen_names} sensitivity ✓"

    # Priority 4: Nutritional property
    diet_tags = product.get("dietary_tags", [])
    if "High-Protein" in diet_tags:
        return "High protein — fits your goals 💪"
    if "Low-Sugar" in diet_tags:
        return "Low sugar option 🍃"
    if "Keto" in diet_tags:
        return "Keto-friendly pick"

    # Priority 5: Generic fallback (never empty)
    return "Recommended for you"


def _time_context() -> str:
    hour = datetime.now().hour
    if 6 <= hour < 10:
        return "morning"
    elif 10 <= hour < 14:
        return "midday"
    elif 14 <= hour < 18:
        return "afternoon"
    elif 18 <= hour < 22:
        return "evening"
    else:
        return "night"


_GREETINGS = {
    "morning": "Good morning ☀️",
    "midday": "Lunch time 🍽️",
    "afternoon": "Afternoon pick-me-up ☕",
    "evening": "Evening essentials 🌆",
    "night": "Late night needs 🌙",
}


def _now_suggestions(time_ctx: str) -> list[dict]:
    categories = TIME_BASED_CATEGORIES.get(time_ctx, ["snacks", "beverages"])
    reason = _GREETINGS.get(time_ctx, "For you right now")
    seen_ids: set[str] = set()
    result: list[dict] = []

    # Pull 2 in-stock products per category from the full catalog
    for cat in categories[:2]:
        count = 0
        for p in ALL_PRODUCTS:
            if not p.get("in_stock"):
                continue
            if p.get("category") != cat:
                continue
            if p["id"] in seen_ids:
                continue
            formatted = _format(p)
            formatted["reason"] = reason
            result.append(formatted)
            seen_ids.add(p["id"])
            count += 1
            if count >= 2:
                break

    return result[:4]


def _reorder_nudges(user_id: str) -> list[dict]:
    if not user_id:
        return []
    try:
        from app.db.dynamo import get_user_orders

        past_orders = get_user_orders(user_id, limit=5)
    except Exception:
        return []

    seen: set[str] = set()
    nudges: list[dict] = []
    for order in past_orders:
        for item in order.get("items", []):
            pid = item.get("product_id")
            if pid and pid not in seen:
                product = next((p for p in ALL_PRODUCTS if p["id"] == pid), None)
                if product:
                    formatted = _format(product)
                    formatted["reason"] = "You ordered this before 🔁"
                    nudges.append(formatted)
                    seen.add(pid)
    return nudges[:3]


def get_recommendations(
    user_id: str | None = None, query: str | None = None, category: str | None = None
) -> dict:
    from app.services.profile_service import get_profile

    time_ctx = _time_context()
    exclusion_set = get_exclusion_set(user_id)

    # Get user profile for personalized reasons (Task 6.2)
    user_profile = None
    if user_id:
        profile_entry = get_profile(user_id)
        if profile_entry:
            user_profile = profile_entry.get("profile")

    # If a query/intent is provided (from NowSpeak chat), use catalog search for now_suggestions
    # Fetch more products (limit=16) for intent queries to increase diversity across intents
    if query:
        from app.services.catalog import search_products as cat_search

        now = cat_search(
            query=query, category=category, limit=16, exclusion_set=exclusion_set
        )
        # Fallback: if searching with category returned nothing, retry without category filter
        # (handles cases where intent + category combination is too restrictive)
        if not now and category:
            now = cat_search(
                query=query, category=None, limit=16, exclusion_set=exclusion_set
            )
        # Add reason for intent-based suggestions (Task 6.3 — includes chat context)
        for p in now:
            p["reason"] = f'Based on: "{query}" 🔍'
        # No products were filtered out for intent-based queries (already filtered by search)
        now_filtered_out = []
    else:
        now_unfiltered = _now_suggestions(time_ctx)
        now = filter_products(now_unfiltered, exclusion_set)
        # Track which products got filtered out (Task 4.3)
        now_filtered_out = [p for p in now_unfiltered if p not in now]

    trending_unfiltered = get_trending()
    reorder = _reorder_nudges(user_id or "")

    # Apply dietary filter to trending and reorder
    trending = filter_products(trending_unfiltered, exclusion_set)
    trending_filtered_out = [p for p in trending_unfiltered if p not in trending]
    reorder = filter_products(reorder, exclusion_set)

    # Backfill if lanes are empty after filtering
    if not now and exclusion_set:
        from app.services.catalog import search_products as cat_search

        backfill_limit = 16 if query else 8
        backfill = cat_search(query="", category=None, limit=backfill_limit)
        now = filter_products(backfill, exclusion_set)[:8]

    # Assign reasons to trending (Task 6.2)
    for p in trending:
        p["reason"] = "Trending near you 🔥"

    # Compute personalized reasons for non-intent now_suggestions and trending (Task 6.2, 6.3)
    if not query:
        for p in now:
            if not p.get("reason") or p["reason"] in (
                _GREETINGS.get(time_ctx, "For you right now"),
            ):
                p["reason"] = _compute_reason(p, user_profile, None)

    # For trending, override generic reason with personalized one when user profile exists
    if user_profile:
        for p in trending:
            personalized = _compute_reason(p, user_profile, None)
            if personalized != "Recommended for you":
                p["reason"] = personalized

    # Find alternatives for filtered-out products (Task 4.3)
    all_filtered_out = now_filtered_out + trending_filtered_out
    safe_products = now + trending
    alternatives = (
        find_alternatives(all_filtered_out, exclusion_set, safe_products)
        if all_filtered_out and exclusion_set
        else []
    )

    return {
        "time_context": time_ctx,
        "now_suggestions": now[:16] if query else now[:8],
        "reorder_nudges": reorder,
        "trending": trending,
        "alternatives": alternatives,
    }
