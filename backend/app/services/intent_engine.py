from __future__ import annotations

"""
NowSpeak Intent Engine — powered by NVIDIA AI Endpoints (z-ai/glm-5.1)
───────────────────────────────────────────────────────────────────────
Two-phase approach (robust for any model, no tool-binding required):

  Phase 1 (sync)  : Ask GLM to extract intent as JSON → get query + category
  Phase 2 (sync)  : Search our catalog with the extracted query
  Phase 3 (stream): Ask GLM to stream a warm 1-2 sentence reply, given the
                    catalog results as context

SSE event shapes:
  {"type": "text",     "delta": "word "}
  {"type": "products", "products": [...]}
  {"type": "done"}
  {"type": "error",    "error": "..."}
"""
import json
import re
from typing import Generator

from langchain_core.messages import SystemMessage, HumanMessage

from app.core.nvidia import llm
from app.services.catalog import search_products as _catalog_search
from app.services.profile_service import get_exclusion_set, filter_products, get_profile

# ── Prompts ───────────────────────────────────────────────────────────────────

_INTENT_PROMPT = """\
Extract the shopping intent from the customer message below.
Respond with ONLY a JSON object — no explanation, no markdown, no code block.

Format:
{{"query": "<specific product search terms>", "category": "<one of: medicine | beverages | dairy | snacks | personal_care | cleaning | baby | home | electronics | fashion | grocery | fresh | (empty string if unsure)>"}}

Customer message: "{message}"
"""

# ── Keyword-based intent fallback (when LLM is unavailable) ───────────────────

_KEYWORD_INTENT_MAP: dict[str, dict] = {
    # Health / Medicine
    "fever": {"query": "paracetamol fever medicine", "category": "medicine"},
    "headache": {"query": "headache pain relief", "category": "medicine"},
    "cold": {"query": "cold cough medicine", "category": "medicine"},
    "cough": {"query": "cough syrup medicine", "category": "medicine"},
    "pain": {"query": "pain relief tablet", "category": "medicine"},
    "stomach": {"query": "stomach antacid digestive", "category": "medicine"},
    "sick": {"query": "medicine health", "category": "medicine"},
    "medicine": {"query": "medicine", "category": "medicine"},
    "tablet": {"query": "tablet medicine", "category": "medicine"},
    # Health / Recovery
    "flu": {"query": "soup vitamin c hydration light food", "category": ""},
    "recovery": {"query": "soup fruits hydration light food recovery", "category": ""},
    "immunity": {
        "query": "vitamin c fruits citrus honey ginger immunity",
        "category": "",
    },
    "hydration": {
        "query": "water coconut water electral juice hydration",
        "category": "beverages",
    },
    "soup": {"query": "soup instant ready to eat warm", "category": "ready_to_eat"},
    # Beverages
    "coffee": {"query": "coffee", "category": "beverages"},
    "tea": {"query": "tea", "category": "beverages"},
    "juice": {"query": "juice", "category": "beverages"},
    "water": {"query": "water", "category": "beverages"},
    "milk": {"query": "milk", "category": "dairy"},
    # Food
    "hungry": {"query": "ready to eat snacks", "category": "snacks"},
    "snack": {"query": "snacks chips namkeen biscuit makhana", "category": "snacks"},
    "breakfast": {
        "query": "breakfast oats cereal bread poha upma idli",
        "category": "breakfast",
    },
    "lunch": {
        "query": "rice dal ready meal biryani khichdi",
        "category": "ready_to_eat",
    },
    "dinner": {
        "query": "dinner chapati dal rice ready meal",
        "category": "ready_to_eat",
    },
    # Diet-specific
    "protein": {
        "query": "high protein paneer tofu lentils chickpeas eggs chicken",
        "category": "high_protein",
    },
    "vegetarian": {"query": "vegetarian paneer tofu plant based dal", "category": ""},
    "vegan": {
        "query": "vegan plant based tofu soy oat milk coconut",
        "category": "plant_based",
    },
    "keto": {"query": "keto low carb avocado nuts cheese paneer eggs", "category": ""},
    "gluten free": {
        "query": "gluten free ragi jowar rice flour millet",
        "category": "allergy_friendly",
    },
    "low sugar": {"query": "sugar free low sugar diet natural", "category": ""},
    # Specific foods
    "fruit": {"query": "fresh fruits apple banana orange mango", "category": "fruits"},
    "fruits": {"query": "fresh fruits apple banana orange mango", "category": "fruits"},
    "vegetable": {
        "query": "fresh vegetables tomato onion potato spinach",
        "category": "vegetables",
    },
    "vegetables": {
        "query": "fresh vegetables tomato onion potato spinach",
        "category": "vegetables",
    },
    "dairy": {"query": "milk curd paneer cheese butter yogurt", "category": "dairy"},
    "paneer": {"query": "paneer cottage cheese protein", "category": "dairy"},
    "eggs": {"query": "eggs protein fresh farm", "category": "high_protein"},
    "chicken": {"query": "chicken breast boneless protein", "category": "high_protein"},
    "fish": {"query": "fish rohu protein fresh", "category": "high_protein"},
    # Situational
    "energy": {"query": "energy bar banana nuts dates glucose", "category": ""},
    "workout": {
        "query": "protein bar whey energy fitness recovery",
        "category": "high_protein",
    },
    "kids": {"query": "cereal milk biscuit juice healthy kids", "category": ""},
    "party": {"query": "chips snacks drinks juice cold drink", "category": "snacks"},
    "cooking": {"query": "oil spices flour atta onion tomato", "category": ""},
    # Baby
    "diaper": {"query": "diapers baby", "category": "baby"},
    "baby": {"query": "baby care", "category": "baby"},
    # Cleaning
    "clean": {"query": "cleaner detergent", "category": "cleaning"},
    "detergent": {"query": "detergent", "category": "cleaning"},
}


def _keyword_fallback_intent(message: str) -> dict:
    """Rule-based intent extraction when LLM is unavailable."""
    msg_lower = message.lower()
    for keyword, intent in _KEYWORD_INTENT_MAP.items():
        if keyword in msg_lower:
            return intent
    return {"query": message, "category": ""}


_REPLY_SYSTEM = """\
You are Amazon Now — an urgent shopping assistant with 30-minute delivery.
You have already found the products the customer needs.
Reply in exactly 1-2 warm, concise sentences acknowledging their situation.
Do NOT list products or use markdown — just a brief human message.
Example: "Got you! Here are the fastest options near you." """

_REPLY_USER = """\
Customer said: "{message}"
Products we found: {product_names}
Write your 1-2 sentence warm reply now."""


# ── Intent extraction ─────────────────────────────────────────────────────────


def _extract_intent(message: str) -> dict:
    """Ask GLM to return the search query + category as JSON.
    Falls back to keyword-based mapping if LLM is unavailable."""
    prompt = _INTENT_PROMPT.format(message=message)
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        text = response.content or ""
        # Find the first {...} JSON object in the response
        match = re.search(r"\{[^{}]+\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return {
                "query": str(data.get("query", message)),
                "category": str(data.get("category", "")),
            }
    except Exception:
        pass
    # Fallback: use keyword-based intent extraction
    return _keyword_fallback_intent(message)


# ── Core streaming function ───────────────────────────────────────────────────


def stream_nowspeak(
    message: str,
    session_id: str,
    user_id: str | None = None,
) -> Generator[str, None, None]:
    """
    Yields SSE-formatted strings.
    FastAPI wraps this in StreamingResponse(media_type="text/event-stream").
    """

    # ── Phase 1: Extract intent ───────────────────────────────────────────────
    try:
        intent = _extract_intent(message)
    except Exception:
        intent = {"query": message, "category": ""}

    # ── Phase 2: Catalog search ───────────────────────────────────────────────
    category = intent["category"] if intent["category"] else None
    found_products = _catalog_search(
        query=intent["query"],
        category=category,
        limit=5,
    )
    if not found_products:
        # Broaden: try without category filter
        found_products = _catalog_search(query=intent["query"], category=None, limit=5)

    # ── Dietary profile filtering ─────────────────────────────────────────────
    exclusion_set = get_exclusion_set(user_id)
    if exclusion_set:
        found_products = filter_products(found_products, exclusion_set)
        if not found_products:
            # Retry without category restriction while still applying exclusion filter
            found_products = _catalog_search(
                query=intent["query"], category=None, limit=10
            )
            found_products = filter_products(found_products, exclusion_set)
        found_products = found_products[:5]

    product_names = ", ".join(p["name"] for p in found_products[:3])
    if not product_names:
        product_names = "None (could not find any matching products in our catalog)"

    # ── Phase 3: Stream warm conversational reply ─────────────────────────────
    # Augment system prompt with diet context
    reply_system = _REPLY_SYSTEM
    if exclusion_set and user_id:
        profile_entry = get_profile(user_id)
        if profile_entry:
            tags = profile_entry["profile"].get("diet_tags", []) + profile_entry[
                "profile"
            ].get("allergen_tags", [])
            if tags:
                reply_system += f"\nThe customer has dietary restrictions: {', '.join(tags)}. Acknowledge this briefly."

    try:
        reply_messages = [
            SystemMessage(content=reply_system),
            HumanMessage(
                content=_REPLY_USER.format(
                    message=message,
                    product_names=product_names,
                )
            ),
        ]
        for chunk in llm.stream(reply_messages):
            text = chunk.content
            if text:
                yield f"data: {json.dumps({'type': 'text', 'delta': text})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'type': 'error', 'error': str(exc)})}\n\n"

    # ── Emit product cards ────────────────────────────────────────────────────
    yield f"data: {json.dumps({'type': 'products', 'products': found_products})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"
