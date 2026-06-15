"""
Recipe endpoint — match recipes from URLs/images + scale ingredients.
"""

from fastapi import APIRouter, Query, UploadFile, File, Form
from typing import Optional
import json

from app.services.recipe_service import match_recipe, get_recipe_response
from app.services.catalog import search_products

router = APIRouter()


@router.post("/recipe")
async def get_recipe_products(
    recipe_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    user_text: Optional[str] = Form(None),
    servings: int = Form(4),
    user_id: Optional[str] = Form(None),
):
    """
    Match recipe from URL, image filename, or text.
    Scale ingredients based on servings.
    Search catalog for each ingredient.
    Return complete cart-ready response.

    Example:
    ```
    curl -X POST http://localhost:8000/api/v1/recipe \\
      -F "recipe_url=https://example.com/carbonara" \\
      -F "servings=6" \\
      -F "user_id=demo_user"
    ```

    Or with image:
    ```
    curl -X POST http://localhost:8000/api/v1/recipe \\
      -F "image_file=@carbonara.jpg" \\
      -F "servings=4"
    ```

    Or with text:
    ```
    curl -X POST http://localhost:8000/api/v1/recipe \\
      -F "user_text=butter chicken for 8 people" \\
      -F "servings=8"
    ```
    """

    # Extract filename from uploaded image
    image_filename = None
    if image_file:
        image_filename = image_file.filename or ""

    # Try to match recipe
    recipe = match_recipe(
        url_or_filename=recipe_url or image_filename,
        user_text=user_text,
    )

    if not recipe:
        return {
            "error": "Recipe not recognized",
            "suggestion": "Try: 'pasta carbonara', 'biryani', 'butter chicken', 'paneer tikka', 'pizza', or 'dal fry'"
        }

    # Get scaled ingredients
    recipe_response = get_recipe_response(recipe["id"], servings)

    # Search catalog for each ingredient
    products_list = []
    for ingredient in recipe_response["ingredients"]:
        # Search for product matching ingredient
        search_results = search_products(
            query=ingredient["product_query"],
            category=ingredient.get("category"),
            limit=1,
        )

        if search_results:
            product = search_results[0]
            # Add ingredient-specific data
            product["ingredient_name"] = ingredient["name"]
            product["required_qty"] = ingredient["quantity"]
            product["required_unit"] = ingredient["unit"]
            products_list.append(product)

    return {
        "recipe_id": recipe_response["recipe_id"],
        "recipe_name": recipe_response["recipe_name"],
        "servings": servings,
        "default_servings": recipe_response["default_servings"],
        "ingredients": recipe_response["ingredients"],
        "products": products_list,
        "total_items": len(products_list),
        "message": f"Perfect! I found everything for {recipe_response['recipe_name']} for {servings} people. Add items to your cart!"
    }


@router.get("/recipes")
async def list_available_recipes():
    """
    List all available recipes for demo/reference.
    """
    from app.db.recipes_config import RECIPES_CONFIG

    return {
        "total": len(RECIPES_CONFIG["recipes"]),
        "recipes": [
            {
                "id": r["id"],
                "name": r["name"],
                "servings": r["default_servings"],
                "ingredient_count": len(r["ingredients"]),
                "examples": r.get("keywords", [])[:2],
            }
            for r in RECIPES_CONFIG["recipes"]
        ]
    }
