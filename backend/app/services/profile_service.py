"""
Dietary & Allergy Profile Service.
Single module consumed by all product-surfacing systems.
Architecture: in-memory dict (mirrors cart_service.py pattern).
"""

from __future__ import annotations

import uuid
from typing import Dict, List, Optional, Set

# ── Tag-to-keyword mappings ──────────────────────────────────────────────────

DIET_TAG_EXCLUSIONS: Dict[str, List[str]] = {
    "vegan": [
        "milk",
        "dairy",
        "egg",
        "meat",
        "chicken",
        "fish",
        "butter",
        "cheese",
        "yogurt",
        "honey",
    ],
    "vegetarian": [
        "meat",
        "chicken",
        "fish",
        "mutton",
        "pork",
        "prawn",
        "shrimp",
    ],
    "keto": [
        "sugar",
        "bread",
        "rice",
        "wheat",
        "flour",
        "atta",
        "noodles",
        "pasta",
    ],
    "halal": [
        "pork",
        "alcohol",
        "wine",
        "beer",
        "rum",
    ],
    "pescatarian": [
        "meat",
        "chicken",
        "mutton",
        "pork",
    ],
    "gluten-free": [
        "wheat",
        "bread",
        "flour",
        "atta",
        "noodles",
        "pasta",
        "biscuit",
        "cookies",
    ],
}

ALLERGEN_TAG_EXCLUSIONS: Dict[str, List[str]] = {
    "nuts": [
        "nut",
        "almond",
        "cashew",
        "peanut",
        "walnut",
        "pistachio",
    ],
    "gluten": [
        "wheat",
        "bread",
        "flour",
        "atta",
        "noodles",
        "pasta",
        "biscuit",
        "cookies",
    ],
    "dairy": [
        "milk",
        "dairy",
        "butter",
        "cheese",
        "yogurt",
        "cream",
        "paneer",
    ],
    "soy": [
        "soy",
        "soya",
        "tofu",
    ],
    "shellfish": [
        "prawn",
        "shrimp",
        "crab",
        "lobster",
        "shellfish",
    ],
    "eggs": [
        "egg",
        "eggs",
    ],
}

# ── In-memory profile store ──────────────────────────────────────────────────

_PROFILES: Dict[str, dict] = {}
# Structure: { user_id: { "profile": {...}, "exclusion_set": set(...) } }


def compute_exclusion_set(
    diet_tags: List[str],
    allergen_tags: List[str],
    custom_exclusions: str = "",
) -> Set[str]:
    """
    Compute the union of all excluded keywords from diet tags,
    allergen tags, and custom exclusions. Pure function.

    - Case-insensitive tag lookup
    - Unknown tags are silently skipped
    - Custom exclusions: split by comma, strip whitespace, lowercase, skip empty
    """
    keywords: Set[str] = set()

    for tag in diet_tags:
        tag_lower = tag.lower()
        if tag_lower in DIET_TAG_EXCLUSIONS:
            keywords.update(DIET_TAG_EXCLUSIONS[tag_lower])

    for tag in allergen_tags:
        tag_lower = tag.lower()
        if tag_lower in ALLERGEN_TAG_EXCLUSIONS:
            keywords.update(ALLERGEN_TAG_EXCLUSIONS[tag_lower])

    if custom_exclusions.strip():
        for kw in custom_exclusions.split(","):
            cleaned = kw.strip().lower()
            if cleaned:
                keywords.add(cleaned)

    return keywords


def save_profile(
    user_id: Optional[str],
    diet_tags: List[str],
    allergen_tags: List[str],
    custom_exclusions: str = "",
) -> dict:
    """
    Persist a profile in memory.
    If user_id is None, generate one using uuid4()[:8].
    Returns {user_id, profile, exclusion_set (sorted list)}.
    """
    if not user_id:
        user_id = str(uuid.uuid4())[:8]

    exclusion_set = compute_exclusion_set(diet_tags, allergen_tags, custom_exclusions)

    _PROFILES[user_id] = {
        "profile": {
            "diet_tags": diet_tags,
            "allergen_tags": allergen_tags,
            "custom_exclusions": custom_exclusions,
        },
        "exclusion_set": exclusion_set,
    }

    return {
        "user_id": user_id,
        "profile": _PROFILES[user_id]["profile"],
        "exclusion_set": sorted(exclusion_set),
    }


def get_profile(user_id: str) -> Optional[dict]:
    """Retrieve a stored profile entry. Returns None if not found."""
    return _PROFILES.get(user_id)


def get_exclusion_set(user_id: Optional[str]) -> Optional[Set[str]]:
    """Get cached exclusion set for a user. Returns None if user_id is None or not found."""
    if not user_id:
        return None
    entry = _PROFILES.get(user_id)
    return entry["exclusion_set"] if entry else None


def filter_products(
    products: List[dict],
    exclusion_set: Optional[Set[str]],
) -> List[dict]:
    """
    Core Filter_Function.
    Removes products whose tags, allergen_tags, or ingredients contain any
    keyword from the exclusion_set. Uses case-insensitive substring matching
    across all three modes for comprehensive allergy safety filtering.

    Modes:
        1. Structured allergen_tags list - checks if any keyword matches any entry
        2. Ingredients list - joins and does substring match
        3. Legacy tags string - backward-compatible substring match

    Args:
        products: List of product dicts (may have "tags", "allergen_tags", "ingredients")
        exclusion_set: Set of lowercase keywords to exclude

    Returns:
        Filtered list of safe products (original order preserved).
        If exclusion_set is None or empty, returns all products unchanged.
    """
    if not exclusion_set:
        return products

    safe: List[dict] = []
    for product in products:
        # Mode 1: Structured allergen_tags check
        product_allergens = [a.lower() for a in product.get("allergen_tags", [])]
        allergen_conflict = any(
            kw in allergen for allergen in product_allergens for kw in exclusion_set
        )

        # Mode 2: Ingredient-level check
        ingredients_text = " ".join(product.get("ingredients", [])).lower()
        ingredient_conflict = any(kw in ingredients_text for kw in exclusion_set)

        # Mode 3: Legacy tags check (backward compatibility)
        tags_lower = product.get("tags", "").lower()
        tags_conflict = any(kw in tags_lower for kw in exclusion_set)

        if not (allergen_conflict or ingredient_conflict or tags_conflict):
            safe.append(product)
    return safe


def get_product_conflicts(
    product: dict,
    exclusion_set: Set[str],
) -> List[str]:
    """
    Returns list of keywords from exclusion_set that conflict with this product.
    Checks allergen_tags, ingredients, and legacy tags fields using
    case-insensitive substring matching.

    Args:
        product: Product dict (may have "tags", "allergen_tags", "ingredients")
        exclusion_set: Set of lowercase keywords to check against

    Returns:
        List of conflicting keywords from the exclusion_set.
    """
    conflicts: List[str] = []
    product_allergens = [a.lower() for a in product.get("allergen_tags", [])]
    ingredients_text = " ".join(product.get("ingredients", [])).lower()
    tags_lower = product.get("tags", "").lower()

    for kw in exclusion_set:
        if any(kw in allergen for allergen in product_allergens):
            conflicts.append(kw)
        elif kw in ingredients_text:
            conflicts.append(kw)
        elif kw in tags_lower:
            conflicts.append(kw)
    return conflicts


def check_product_conflicts(
    product: dict,
    participant_profiles: Dict[str, Set[str]],
) -> List[dict]:
    """
    (Stretch) Check a product against multiple participants' exclusion sets.
    Returns list of {"participant": id, "conflicts": [matched_keywords]}.
    """
    warnings: List[dict] = []
    tags_lower = product.get("tags", "").lower()

    for participant_id, exclusion_set in participant_profiles.items():
        matched = [kw for kw in exclusion_set if kw in tags_lower]
        if matched:
            warnings.append(
                {
                    "participant": participant_id,
                    "conflicts": matched,
                }
            )

    return warnings
