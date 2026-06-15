"""
Enhanced Food Catalog Loader.
Loads 200+ structured food products from the JSON data file.
"""

from __future__ import annotations

import json
import os
from typing import List

_DATA_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "data",
    "food_catalog_enhanced.json",
)


def _load_food_catalog() -> List[dict]:
    """Load the enhanced food catalog from JSON."""
    try:
        with open(_DATA_PATH, "r", encoding="utf-8") as f:
            products = json.load(f)
        return products
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"[food_catalog] Warning: Could not load enhanced catalog: {e}")
        return []


FOOD_ENHANCED_PRODUCTS: List[dict] = _load_food_catalog()
