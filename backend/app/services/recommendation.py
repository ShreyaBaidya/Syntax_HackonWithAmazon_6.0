from __future__ import annotations
"""
Smart Recommendations Engine.
Three lanes: Now Suggestions (time-based) · Reorder Nudges · Trending.
"""
from datetime import datetime

from app.db.seed import TIME_BASED_CATEGORIES
from app.services.catalog import ALL_PRODUCTS, _format, get_trending


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
    "morning":   "Good morning ☀️",
    "midday":    "Lunch time 🍽️",
    "afternoon": "Afternoon pick-me-up ☕",
    "evening":   "Evening essentials 🌆",
    "night":     "Late night needs 🌙",
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


def get_recommendations(user_id: str | None = None) -> dict:
    time_ctx = _time_context()
    trending = get_trending()
    for p in trending:
        p["reason"] = "Trending near you 🔥"

    return {
        "time_context":    time_ctx,
        "now_suggestions": _now_suggestions(time_ctx),
        "reorder_nudges":  _reorder_nudges(user_id or ""),
        "trending":        trending,
    }
