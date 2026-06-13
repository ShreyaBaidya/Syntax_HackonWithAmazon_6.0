"""Load the Amazon Now JSON catalog into the app's product contract."""
from __future__ import annotations

import json
import pathlib
from functools import lru_cache


_DATA_FILE = (
    pathlib.Path(__file__).parents[2]
    / "data"
    / "amazon_now_darkstore_products_5k (1).json"
)

_CATEGORY_MAP: dict[str, str] = {
    "Accessories": "fashion",
    "Baby Products": "baby",
    "Beverages": "beverages",
    "Dairy and Eggs": "dairy",
    "Dress": "fashion",
    "Electronics": "electronics",
    "Fresh": "fresh",
    "Garments": "fashion",
    "Gifts and Decorations": "home",
    "Groceries": "grocery",
    "Health": "medicine",
    "Medicines": "medicine",
    "Personal Care": "personal_care",
    "Product Cleaners": "cleaning",
    "Snacks": "snacks",
}

_ETA_MAP: dict[str, int] = {
    "fresh": 18,
    "dairy": 18,
    "beverages": 20,
    "snacks": 20,
    "grocery": 22,
    "medicine": 22,
    "personal_care": 24,
    "cleaning": 25,
    "baby": 24,
    "home": 28,
    "electronics": 30,
    "fashion": 30,
}


def _make_tags(item: dict, category_slug: str) -> str:
    """Combine searchable Amazon metadata without changing the API shape."""
    values = (
        item.get("title"),
        item.get("brand"),
        item.get("category"),
        item.get("subcategory"),
        item.get("description"),
        category_slug.replace("_", " "),
    )
    words = " ".join(str(value or "") for value in values).lower().split()
    return " ".join(dict.fromkeys(words))


def _unit(item: dict) -> str:
    attributes = item.get("attributes") or {}
    return str(
        attributes.get("size_or_volume")
        or attributes.get("pack_size")
        or "piece"
    ).strip()


@lru_cache(maxsize=1)
def _load() -> list[dict]:
    if not _DATA_FILE.exists():
        return []

    try:
        raw_products = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError):
        return []

    if not isinstance(raw_products, list):
        return []

    products: list[dict] = []
    for item in raw_products:
        if not isinstance(item, dict):
            continue

        product_id = str(item.get("product_Id") or item.get("sku") or "").strip()
        name = str(item.get("title") or "").strip()
        try:
            price = round(float(item.get("price") or 0), 2)
            stock_quantity = int(item.get("stock_quantity") or 0)
        except (TypeError, ValueError):
            continue

        if not product_id or not name or price <= 0:
            continue

        raw_category = str(item.get("category") or "").strip()
        category_slug = _CATEGORY_MAP.get(raw_category, "grocery")
        availability = str(item.get("availability_status") or "").strip().lower()
        ratings = item.get("ratings") or {}

        try:
            rating = float(ratings.get("average_rating") or 0)
            review_count = int(ratings.get("review_count") or 0)
        except (TypeError, ValueError):
            rating, review_count = 0.0, 0

        products.append({
            "id": product_id,
            "name": name,
            "category": category_slug,
            "price": price,
            "mrp": price,
            "discount_percent": 0,
            "unit": _unit(item),
            "eta_min": _ETA_MAP.get(category_slug, 28),
            "in_stock": stock_quantity > 0 and availability != "out of stock",
            "image_url": str(item.get("image_url") or "").strip(),
            "tags": _make_tags(item, category_slug),
            "sku": str(item.get("sku") or ""),
            "brand": str(item.get("brand") or ""),
            "subcategory": str(item.get("subcategory") or ""),
            "stock_quantity": stock_quantity,
            "rating": rating,
            "review_count": review_count,
        })

    return products


AMAZON_PRODUCTS: list[dict] = _load()
