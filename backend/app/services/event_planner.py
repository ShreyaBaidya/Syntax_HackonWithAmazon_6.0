"""
Event Planner — LLM maps Google Calendar events to product suggestions.

Given today's events and the customer's purchase preferences,
the LLM suggests what to buy for each event. Results are tagged
frequency="today" and appear in the "Today" tab of the Home Refill card.
"""

from __future__ import annotations

import json
import re


def _build_preference_summary(history: list[dict]) -> str:
    """Build a compact preference string from purchase history."""
    from collections import Counter

    counts: Counter = Counter()
    titles: dict[str, str] = {}

    for entry in history:
        pid = entry.get("product_id", "")
        title = entry.get("title", "")
        if pid and title:
            counts[pid] += 1
            titles[pid] = title

    top = counts.most_common(10)
    lines = [f"- {titles[pid]} (ordered {cnt}x)" for pid, cnt in top if pid in titles]
    return "\n".join(lines) if lines else "No purchase history available."


def suggest_for_events(
    events: list[dict],
    purchase_history: list[dict],
) -> list[dict]:
    """
    Given a list of today's calendar events and the customer's flat purchase
    history, ask the LLM to suggest products for each event.

    Returns a list of product-like dicts with frequency="today".
    Falls back to catalog search if LLM is unavailable.
    """
    if not events:
        return []

    preferences = _build_preference_summary(purchase_history)
    events_text = "\n".join(
        f"- {e['title']} at {e.get('time', 'unknown time')}: {e.get('description', '')} (type: {e.get('type', 'general')})"
        for e in events
    )

    # Available catalog categories for the LLM to ground suggestions
    categories = [
        "beverages",
        "snacks",
        "dairy",
        "fresh",
        "grocery",
        "medicine",
        "personal_care",
        "cleaning",
        "baby",
        "electronics",
    ]

    system_prompt = """\
You are a smart shopping assistant for an Indian quick-commerce app.
A customer has events in their Google Calendar today. Based on their
purchase history and the events, suggest products they should buy NOW.

Rules:
1. Only suggest products relevant to today's events
2. Match suggestions to the customer's known brand preferences when possible
3. Return 3-6 products per event (not duplicates across events)
4. For each product, provide:
   - category: one of the available categories
   - search_keywords: 2-3 keywords to find the product in the catalog
   - reason: short reason (max 12 words) tying it to the event
   - quantity_hint: suggested quantity (1, 2, or 4)
5. Respond ONLY with a JSON array. No markdown, no explanation.

Format:
[
  {
    "category": "snacks",
    "search_keywords": "lays chips crisps",
    "reason": "Party snacks for tonight's gathering",
    "quantity_hint": 2
  }
]"""

    user_prompt = f"""
Today's Events:
{events_text}

Customer's Purchase Preferences:
{preferences}

Available Categories: {", ".join(categories)}

Suggest products for today's events. Return JSON array."""

    try:
        from app.core.nvidia import llm
        from langchain_core.messages import SystemMessage, HumanMessage

        response = llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
        )

        text = response.content or ""
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if not match:
            raise ValueError("No JSON array in LLM response")

        suggestions = json.loads(match.group())
        return _resolve_to_products(suggestions, events)

    except Exception:
        # Fallback: return hardcoded suggestions based on event type
        return _fallback_suggestions(events)


def _resolve_to_products(suggestions: list[dict], events: list[dict]) -> list[dict]:
    """
    For each LLM suggestion, search the catalog by keywords and return
    a real product tagged with frequency="today".
    """
    from app.services.catalog import search_products

    results: list[dict] = []
    seen_ids: set[str] = set()

    for s in suggestions:
        keywords = s.get("search_keywords", "")
        category = s.get("category", "")
        reason = s.get("reason", "For today's event")
        qty_hint = int(s.get("quantity_hint", 1))

        found = search_products(query=keywords, category=category, limit=1)
        if not found:
            found = search_products(query=keywords, category=None, limit=1)

        if found:
            product = dict(found[0])
            if product["id"] in seen_ids:
                continue
            seen_ids.add(product["id"])

            product["refill_info"] = {
                "avg_gap_days": 0,
                "days_since_last": 0,
                "urgency": 1.0,
                "purchase_count": 0,
                "frequency": "today",
                "reason": reason,
                "last_purchased": "",
            }
            product["ai_reason"] = reason
            product["quantity_hint"] = qty_hint
            product["event_source"] = events[0]["title"] if events else "Today's Event"
            results.append(product)

    return results


def _fallback_suggestions(events: list[dict]) -> list[dict]:
    """Simple keyword-based fallback when LLM is unavailable."""
    from app.services.catalog import search_products

    type_keywords = {
        "party": [
            ("snacks", "chips"),
            ("beverages", "cold drink"),
            ("home", "disposable cups"),
        ],
        "festival": [("snacks", "sweets"), ("beverages", "juice"), ("grocery", "ghee")],
        "guest": [("beverages", "tea"), ("snacks", "biscuits"), ("dairy", "milk")],
        "workout": [
            ("beverages", "protein shake"),
            ("fresh", "banana"),
            ("snacks", "energy bar"),
        ],
        "health": [
            ("medicine", "paracetamol"),
            ("beverages", "ors"),
            ("grocery", "soup"),
        ],
        "travel": [
            ("snacks", "chips"),
            ("beverages", "water"),
            ("personal_care", "hand sanitizer"),
        ],
    }

    results: list[dict] = []
    seen_ids: set[str] = set()

    for event in events:
        pairs = type_keywords.get(event.get("type", "general"), type_keywords["party"])
        for cat, kw in pairs:
            found = search_products(query=kw, category=cat, limit=1)
            if found and found[0]["id"] not in seen_ids:
                p = dict(found[0])
                seen_ids.add(p["id"])
                p["refill_info"] = {
                    "avg_gap_days": 0,
                    "days_since_last": 0,
                    "urgency": 1.0,
                    "purchase_count": 0,
                    "frequency": "today",
                    "reason": f"For {event['title']}",
                    "last_purchased": "",
                }
                p["ai_reason"] = f"For {event['title']}"
                results.append(p)

    return results
