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

# ── Prompts ───────────────────────────────────────────────────────────────────

_INTENT_PROMPT = """\
Extract the shopping intent from the customer message below.
Respond with ONLY a JSON object — no explanation, no markdown, no code block.

Format:
{{"query": "<specific product search terms>", "category": "<one of: medicine | beverages | dairy | snacks | personal_care | cleaning | baby | home | electronics | fashion | grocery | fresh | (empty string if unsure)>"}}

Customer message: "{message}"
"""

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
    """Ask GLM to return the search query + category as JSON."""
    prompt = _INTENT_PROMPT.format(message=message)
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        text = response.content or ""
        # Find the first {...} JSON object in the response
        match = re.search(r'\{[^{}]+\}', text, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return {
                "query":    str(data.get("query", message)),
                "category": str(data.get("category", "")),
            }
    except Exception:
        pass
    # Fallback: use the raw message as the search query
    return {"query": message, "category": ""}


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
    except Exception as exc:
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
    if not found_products:
        # Last resort: return top trending
        found_products = _catalog_search(query="", limit=4)

    product_names = ", ".join(p["name"] for p in found_products[:3])

    # ── Phase 3: Stream warm conversational reply ─────────────────────────────
    try:
        reply_messages = [
            SystemMessage(content=_REPLY_SYSTEM),
            HumanMessage(content=_REPLY_USER.format(
                message=message,
                product_names=product_names,
            )),
        ]
        for chunk in llm.stream(reply_messages):
            text = chunk.content
            if text:
                yield f'data: {json.dumps({"type": "text", "delta": text})}\n\n'
    except Exception as exc:
        yield f'data: {json.dumps({"type": "error", "error": str(exc)})}\n\n'

    # ── Emit product cards ────────────────────────────────────────────────────
    yield f'data: {json.dumps({"type": "products", "products": found_products})}\n\n'
    yield f'data: {json.dumps({"type": "done"})}\n\n'
