"""
Predictive Refill Engine — LLM-enhanced
─────────────────────────────────────────
Phase 1 (algorithmic):
  - Extract flat purchase history from _ORDER_HISTORY
  - Compute avg purchase gap per product
  - Flag products where days_since >= avg_gap * 0.75 (likely running low)

Phase 2 (LLM deduplication + preference):
  - Group flagged products by semantic type (e.g. "lactose free milk")
  - For each group with duplicates: ask LLM which ONE to recommend
    based on purchase frequency, recency, and value-for-money
  - If product already in current cart, skip that type entirely
  - LLM also sets a human-readable "ai_reason" for each recommendation

Result: a clean, non-redundant refill bundle — one product per need.
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import date
from typing import Optional


REFILL_THRESHOLD = 0.75
_TODAY = date.today()


# ── Step 1: Extract flat purchase history ────────────────────────────────────

def _clean_url(raw: str) -> str:
    m = re.search(r'https?://[^\s\)\]]+', raw)
    return m.group() if m else raw


def _extract_history(user_id: Optional[str] = None) -> list[dict]:
    from app.db.order_store import _ORDER_HISTORY
    flat: list[dict] = []
    for entry in _ORDER_HISTORY:
        # ── Format 1: wrapper with "customers" list ───────────────────────
        if "customers" in entry:
            for customer in entry["customers"]:
                # Filter by user_id if provided
                if user_id and customer.get("user_id") != user_id:
                    continue
                for order in customer.get("orders", []):
                    date_str = order.get("order_date", "")
                    if not date_str:
                        continue
                    for product in order.get("products", []):
                        flat.append({
                            "product_id": product.get("product_id", ""),
                            "date":       date_str,
                            "title":      product.get("title", ""),
                            "brand":      product.get("brand", ""),
                            "category":   product.get("category", ""),
                            "image_url":  _clean_url(product.get("imageUrl", "")),
                            "price":      float(product.get("price", 0)),
                        })

        # ── Format 2: legacy flat customer dict with "orders" key ─────────
        elif "orders" in entry:
            if user_id and entry.get("user_id") != user_id:
                continue
            for order in entry["orders"]:
                date_str = order.get("order_date", "")
                if not date_str:
                    continue
                for product in order.get("products", []):
                    flat.append({
                        "product_id": product.get("product_id", ""),
                        "date":       date_str,
                        "title":      product.get("title", ""),
                        "brand":      product.get("brand", ""),
                        "category":   product.get("category", ""),
                        "image_url":  _clean_url(product.get("imageUrl", "")),
                        "price":      float(product.get("price", 0)),
                    })

        # ── Format 3: flat order dict (from place_order) ──────────────────
        elif "order_id" in entry:
            if user_id and entry.get("user_id") != user_id:
                continue
            date_str = entry.get("created_at", "")[:10]
            if not date_str:
                continue
            for item in entry.get("items", []):
                flat.append({
                    "product_id": item.get("product_id", ""),
                    "date":       date_str,
                    "title":      item.get("title", ""),
                    "brand":      item.get("brand", ""),
                    "category":   item.get("category", ""),
                    "image_url":  item.get("image_url", ""),
                    "price":      float(item.get("price", 0)),
                })
    return [e for e in flat if e["product_id"]]


# ── Step 2: Compute purchase patterns ───────────────────────────────────────

def _compute_patterns(history: list[dict]) -> dict[str, dict]:
    dates_by_pid: dict[str, list[date]]  = defaultdict(list)
    meta_by_pid:  dict[str, dict]        = {}

    for entry in history:
        pid = entry["product_id"]
        try:
            d = date.fromisoformat(entry["date"])
        except ValueError:
            continue
        dates_by_pid[pid].append(d)
        if pid not in meta_by_pid:
            meta_by_pid[pid] = {
                "title":    entry.get("title", ""),
                "brand":    entry.get("brand", ""),
                "category": entry.get("category", ""),
                "image_url":entry.get("image_url", ""),
                "price":    entry.get("price", 0.0),
            }

    patterns: dict[str, dict] = {}
    for pid, dates in dates_by_pid.items():
        if len(dates) < 2:
            continue
        sorted_dates = sorted(dates, reverse=True)
        gaps = [(sorted_dates[i] - sorted_dates[i + 1]).days
                for i in range(len(sorted_dates) - 1)]
        avg_gap       = sum(gaps) / len(gaps)
        days_since    = (_TODAY - sorted_dates[0]).days
        urgency       = round(days_since / avg_gap, 2) if avg_gap > 0 else 0
        patterns[pid] = {
            "purchase_count":  len(dates),
            "avg_gap_days":    round(avg_gap, 1),
            "days_since_last": days_since,
            "urgency":         urgency,
            "last_purchased":  sorted_dates[0].isoformat(),
            **meta_by_pid.get(pid, {}),
        }
    return patterns


# ── Step 3: Resolve price and stock from catalog ─────────────────────────────

def _resolve_product(pid: str, pattern: dict) -> dict | None:
    from app.db.amazon_catalog import AMAZON_PRODUCTS
    catalog_hit = next(
        (p for p in AMAZON_PRODUCTS if p.get("sku") == pid or p.get("id") == pid),
        None
    )
    if catalog_hit:
        return {
            "id":               pid,
            "name":             catalog_hit.get("name") or pattern.get("title", pid),
            "price":            catalog_hit.get("price") or pattern.get("price", 0.0),
            "mrp":              catalog_hit.get("mrp", catalog_hit.get("price", 0.0)),
            "discount_percent": catalog_hit.get("discount_percent", 0),
            "unit":             catalog_hit.get("unit", "piece"),
            "image_url":        catalog_hit.get("image_url") or pattern.get("image_url", ""),
            "eta_min":          catalog_hit.get("eta_min", 28),
            "category":         catalog_hit.get("category", ""),
            "brand":            pattern.get("brand", ""),
            "tags":             catalog_hit.get("tags", ""),
            "in_stock":         catalog_hit.get("in_stock", True),
        }
    title = pattern.get("title", "")
    if not title:
        return None
    return {
        "id":               pid,
        "name":             title,
        "price":            float(pattern.get("price", 0.0)),
        "mrp":              float(pattern.get("price", 0.0)),
        "discount_percent": 0,
        "unit":             "piece",
        "image_url":        pattern.get("image_url", ""),
        "eta_min":          28,
        "category":         pattern.get("category", ""),
        "brand":            pattern.get("brand", ""),
        "tags":             "",
        "in_stock":         True,
    }


# ── Step 4: LLM deduplication + preference analysis ─────────────────────────

def _llm_deduplicate(
    candidates: list[dict],
    cart_item_names: list[str],
) -> list[dict]:
    """
    Sends candidate refill products to the LLM with purchase pattern context.
    LLM returns a deduplicated list — one product per semantic need —
    choosing the preferred variant based on frequency / value, and skipping
    anything already in the cart.

    Returns the refined list with 'ai_reason' field added.
    Falls back to simple rule-based deduplication if LLM is unavailable.
    """
    try:
        from app.core.nvidia import llm
        from langchain_core.messages import SystemMessage, HumanMessage

        # Build concise summary for LLM
        product_summary = []
        for c in candidates:
            ri = c.get("refill_info", {})
            product_summary.append({
                "id":             c["id"],
                "name":           c["name"],
                "brand":          c.get("brand", ""),
                "price_inr":      c["price"],
                "purchase_count": ri.get("purchase_count", 0),
                "avg_gap_days":   ri.get("avg_gap_days", 0),
                "days_since_last_purchase": ri.get("days_since_last", 0),
                "urgency_score":  ri.get("urgency", 0),
            })

        system_prompt = """\
You are an intelligent home refill assistant for an Indian quick-commerce app.
Your goal: build the best refill basket based on customer history and current cart.

CORE RULES:

1. DEFAULT (no cart conflict): For each product need (e.g. "lactose-free milk"),
   recommend only the ONE product the customer most frequently buys from history.
   purchase_count is the preference signal — higher = preferred brand.

2. EXCEPTION (cart has a DIFFERENT BRAND of the same need):
   If the customer's cart already has Brand X, but history shows they regularly buy Brand Y,
   include BOTH in the refill suggestions — their usual (Brand Y from history) AND
   the one already in cart (Brand X).
   The ai_reason should acknowledge the difference:
   e.g. "Your usual milk — though cart has Amul, your go-to is Nandini"

3. ALREADY SATISFIED (same product already in cart): if the cart has the EXACT same product
   from history, skip it from refill (no need to suggest it again).

4. For products with no cart conflict: pick the most frequent brand, skip duplicates.

5. Write "ai_reason" (max 15 words) for every included product.

Respond ONLY with a JSON array:
[{"id": "...", "ai_reason": "..."}, ...]
No markdown, no explanation."""

        user_prompt = f"""
Customer's CURRENT CART: {cart_item_names if cart_item_names else ['nothing yet']}

Refill candidates from purchase history (sorted by urgency):
{json.dumps(product_summary, indent=2)}

Apply the rules. Return JSON array."""

        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])

        text = response.content or ""
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if not match:
            raise ValueError("No JSON array in LLM response")

        kept = json.loads(match.group())
        id_to_reason = {item["id"]: item.get("ai_reason", "") for item in kept}
        kept_ids = set(id_to_reason.keys())

        result = []
        for c in candidates:
            if c["id"] in kept_ids:
                c = dict(c)
                c["ai_reason"] = id_to_reason[c["id"]]
                result.append(c)
        return result

    except Exception as exc:
        # ── Fallback: rule-based deduplication without LLM ──────────────────
        # Group by normalized product type keyword, keep highest purchase_count
        type_groups: dict[str, list[dict]] = defaultdict(list)

        # Simple keyword extraction: take first 3 meaningful words of name
        def type_key(name: str) -> str:
            stopwords = {"and", "with", "of", "the", "a", "an", "in", "for",
                         "pack", "ml", "g", "kg", "l", "free"}
            words = [w.lower() for w in name.split() if w.lower() not in stopwords]
            # Use category + first distinctive noun as key
            return " ".join(words[:3])

        for c in candidates:
            key = type_key(c["name"])
            type_groups[key].append(c)

        # Filter out cart items by name keyword match
        cart_keywords = {w.lower() for name in cart_item_names
                         for w in name.split() if len(w) > 3}

        result = []
        for key, group in type_groups.items():
            # Skip if any word in this product name is already in cart
            name_words = {w.lower() for w in key.split()}
            if name_words & cart_keywords:
                continue
            # Pick the one with highest purchase count
            best = max(group, key=lambda x: x.get("refill_info", {}).get("purchase_count", 0))
            best = dict(best)
            best["ai_reason"] = "Most frequently purchased in this category"
            result.append(best)
        return result


# ── Step 5: Classify and build reasons ───────────────────────────────────────

def _classify(avg_gap: float) -> str:
    if avg_gap <= 10:  return "weekly"
    if avg_gap <= 20:  return "biweekly"
    return "monthly"


def _reason(name: str, p: dict) -> str:
    days, avg, urgency = p["days_since_last"], p["avg_gap_days"], p["urgency"]
    if urgency >= 1.2:
        return f"Overdue — usually bought every {avg:.0f} days, last {days} days ago"
    if urgency >= 1.0:
        return f"Likely out — bought {days} days ago, avg every {avg:.0f} days"
    return f"Running low — {days} days since last purchase (avg: {avg:.0f} days)"


# ── Main entry point ─────────────────────────────────────────────────────────

def get_refill_suggestions(
    user_id: Optional[str] = None,
    cart_item_names: list[str] | None = None,
    access_token: Optional[str] = None,
) -> dict:
    """
    Returns an LLM-optimized Home Refill bundle.

    cart_item_names: product names already in cart (avoid redundant suggestions).
    access_token: Google OAuth token for fetching real calendar events.
    """
    cart_item_names = cart_item_names or []

    history  = _extract_history(user_id=user_id)
    patterns = _compute_patterns(history)

    # Phase 1: algorithmic candidates (weekly / biweekly / monthly)
    candidates: list[dict] = []
    for pid, pattern in patterns.items():
        if pattern["urgency"] < REFILL_THRESHOLD:
            continue
        product = _resolve_product(pid, pattern)
        if not product or not product.get("in_stock", True):
            continue
        candidates.append({
            **product,
            "refill_info": {
                "avg_gap_days":    pattern["avg_gap_days"],
                "days_since_last": pattern["days_since_last"],
                "urgency":         pattern["urgency"],
                "purchase_count":  pattern["purchase_count"],
                "frequency":       _classify(pattern["avg_gap_days"]),
                "reason":          _reason(product["name"], pattern),
                "last_purchased":  pattern["last_purchased"],
            },
        })

    candidates.sort(key=lambda x: x["refill_info"]["urgency"], reverse=True)

    # Phase 2: LLM deduplication + preference analysis
    suggestions = _llm_deduplicate(candidates, cart_item_names)
    suggestions.sort(key=lambda x: x.get("refill_info", {}).get("urgency", 0), reverse=True)

    # Phase 3: Google Calendar event-based suggestions (today tab)
    today_items: list[dict] = []
    try:
        from app.services.google_calendar import get_today_events
        from app.services.event_planner import suggest_for_events
        events = get_today_events(access_token=access_token)
        if events:
            today_items = suggest_for_events(events, history)
    except Exception:
        pass

    all_items = today_items + suggestions
    today    = [s for s in all_items if s["refill_info"]["frequency"] == "today"]
    weekly   = [s for s in all_items if s["refill_info"]["frequency"] == "weekly"]
    biweekly = [s for s in all_items if s["refill_info"]["frequency"] == "biweekly"]
    monthly  = [s for s in all_items if s["refill_info"]["frequency"] == "monthly"]
    total    = round(sum(s["price"] for s in all_items), 2)

    return {
        "bundle_name": "🏠 Home Refill",
        "subtitle":    f"{len(all_items)} items likely running low",
        "total":       total,
        "item_count":  len(all_items),
        "items":       all_items,
        "grouped": {
            "today":    {"label": "📅 Today's Planner",  "sublabel": "Based on your calendar events", "items": today},
            "weekly":   {"label": "📅 Weekly Restock",   "sublabel": "Every 5–10 days",  "items": weekly},
            "biweekly": {"label": "🗓️ Bi-weekly",       "sublabel": "Every 11–20 days", "items": biweekly},
            "monthly":  {"label": "📦 Monthly Pantry",   "sublabel": "Every 3–4 weeks",  "items": monthly},
        },
    }
