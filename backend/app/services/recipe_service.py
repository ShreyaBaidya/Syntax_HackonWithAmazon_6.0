"""
Recipe matching service.
Matches recipe URLs/image filenames against recipes_config.json.
Scales ingredient quantities based on servings.
"""

import json
import re
from pathlib import Path
from typing import Optional

# Load recipes config
RECIPES_CONFIG_PATH = Path(__file__).parent.parent / "db" / "recipes_config.json"
with open(RECIPES_CONFIG_PATH) as f:
    RECIPES_CONFIG = json.load(f)

RECIPES_BY_ID = {r["id"]: r for r in RECIPES_CONFIG["recipes"]}


def _normalize_text(text: str) -> str:
    """Normalize text for matching."""
    return text.lower().strip()


def match_recipe(
    url_or_filename: Optional[str] = None,
    user_text: Optional[str] = None,
) -> Optional[dict]:
    """
    Match recipe from URL, filename, or user text.
    Returns recipe dict or None if no match.
    """
    search_text = ""

    # Extract keywords from URL/filename
    if url_or_filename:
        search_text += url_or_filename.lower()

    # Add user text
    if user_text:
        search_text += " " + user_text.lower()

    if not search_text:
        return None

    # Try exact keyword matches first (highest priority)
    for recipe in RECIPES_CONFIG["recipes"]:
        for keyword in recipe.get("keywords", []):
            if keyword in search_text:
                return recipe

    # Try regex pattern matches (medium priority)
    for recipe in RECIPES_CONFIG["recipes"]:
        for pattern in recipe.get("url_patterns", []):
            if re.search(pattern, search_text):
                return recipe
        for pattern in recipe.get("image_patterns", []):
            if re.search(pattern, search_text):
                return recipe

    return None


def scale_ingredients(recipe: dict, servings: int) -> list[dict]:
    """
    Scale recipe ingredients based on servings.
    Returns list of scaled ingredients.
    """
    default_servings = recipe["default_servings"]
    scaling_factor = servings / default_servings

    scaled = []
    for ingredient in recipe["ingredients"]:
        scaled_qty = ingredient["base_qty"] * scaling_factor
        scaled.append(
            {
                "name": ingredient["name"],
                "quantity": round(scaled_qty, 1),
                "unit": ingredient["base_unit"],
                "category": ingredient["category"],
                "product_query": ingredient["product_query"],
            }
        )
    return scaled


def get_recipe_response(recipe_id: str, servings: int = 4) -> dict:
    """
    Get complete recipe response with scaled ingredients.
    """
    recipe = RECIPES_BY_ID.get(recipe_id)
    if not recipe:
        return {"error": "Recipe not found"}

    return {
        "recipe_id": recipe["id"],
        "recipe_name": recipe["name"],
        "default_servings": recipe["default_servings"],
        "requested_servings": servings,
        "ingredients": scale_ingredients(recipe, servings),
    }
