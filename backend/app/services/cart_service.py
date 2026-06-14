"""
Shared Cart Service — in-memory store with SSE broadcast.

Architecture:
  CARTS   : cart_id → CartState dict (mutable)
  STREAMS : cart_id → list of asyncio.Queue (one per connected browser tab)

When any participant modifies a cart, _broadcast() serialises the new
CartState and pushes it into every queue for that cart_id. Each SSE
connection drains its queue and forwards the JSON to the browser.
"""
from __future__ import annotations

import asyncio
import json
import random
import string
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from app.models.cart import CartItem, CartState
from app.services.catalog import get_products_by_ids

# ── In-memory stores ─────────────────────────────────────────────────────────
# Raw dicts so we can mutate them without Pydantic copy-on-validate overhead
_CARTS: Dict[str, dict] = {}
_STREAMS: Dict[str, List[asyncio.Queue]] = {}


def _gen_id(length: int = 6) -> str:
    """Generate a short uppercase alphanumeric cart ID (e.g. 'ABC123')."""
    chars = string.ascii_uppercase + string.digits
    while True:
        cid = "".join(random.choices(chars, k=length))
        if cid not in _CARTS:
            return cid


def _compute_totals(items: dict) -> Tuple[float, int]:
    total = sum(v["price"] * v["quantity"] for v in items.values())
    count = sum(v["quantity"] for v in items.values())
    return round(total, 2), count


def _to_state(cart: dict) -> CartState:
    return CartState(
        cart_id=cart["cart_id"],
        items={k: CartItem(**v) for k, v in cart["items"].items()},
        participants=cart["participants"],
        total=cart["total"],
        item_count=cart["item_count"],
        created_at=cart["created_at"],
    )


async def _broadcast(cart_id: str, event_type: str, message: str = "") -> None:
    """Push a cart_update SSE event to every connected listener."""
    cart = _CARTS.get(cart_id)
    if not cart:
        return
    state = _to_state(cart)
    payload = json.dumps({
        "type":    event_type,
        "cart":    state.model_dump(),
        "message": message,
    })
    data = f"data: {payload}\n\n"
    dead: list[asyncio.Queue] = []
    for q in list(_STREAMS.get(cart_id, [])):
        try:
            q.put_nowait(data)
        except asyncio.QueueFull:
            dead.append(q)
    # Prune full / dead queues
    for q in dead:
        _STREAMS[cart_id].remove(q)


# ── Public API ────────────────────────────────────────────────────────────────

def create_cart(participant_name: str = "You") -> CartState:
    cart_id = _gen_id()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    _CARTS[cart_id] = {
        "cart_id":      cart_id,
        "items":        {},
        "participants": [participant_name],
        "total":        0.0,
        "item_count":   0,
        "created_at":   now,
    }
    _STREAMS[cart_id] = []
    return _to_state(_CARTS[cart_id])


def get_cart(cart_id: str) -> Optional[CartState]:
    cart = _CARTS.get(cart_id)
    return _to_state(cart) if cart else None


async def add_item(
    cart_id: str,
    product_id: str,
    participant_name: str,
    quantity: int = 1,
) -> Optional[CartState]:
    cart = _CARTS.get(cart_id)
    if not cart:
        return None

    if product_id in cart["items"]:
        # Increment quantity and track who also added it
        cart["items"][product_id]["quantity"] += quantity
        if participant_name not in cart["items"][product_id]["added_by"]:
            cart["items"][product_id]["added_by"].append(participant_name)
    else:
        # Fetch product details from catalog
        products = get_products_by_ids([product_id])
        if not products:
            return None
        p = products[0]
        cart["items"][product_id] = {
            "product_id": product_id,
            "name":       p["name"],
            "price":      p["price"],
            "unit":       p["unit"],
            "image_url":  p["image_url"],
            "category":   p["category"],
            "quantity":   quantity,
            "added_by":   [participant_name],
        }

    cart["total"], cart["item_count"] = _compute_totals(cart["items"])
    await _broadcast(cart_id, "cart_update",
                     f"{participant_name} added {cart['items'][product_id]['name']}")
    return _to_state(cart)


async def update_quantity(
    cart_id: str,
    product_id: str,
    quantity: int,
) -> Optional[CartState]:
    cart = _CARTS.get(cart_id)
    if not cart or product_id not in cart["items"]:
        return None

    if quantity <= 0:
        del cart["items"][product_id]
    else:
        cart["items"][product_id]["quantity"] = quantity

    cart["total"], cart["item_count"] = _compute_totals(cart["items"])
    await _broadcast(cart_id, "cart_update", "Cart updated")
    return _to_state(cart)


async def remove_item(cart_id: str, product_id: str) -> Optional[CartState]:
    cart = _CARTS.get(cart_id)
    if not cart:
        return None
    removed_name = cart["items"].pop(product_id, {}).get("name", product_id)
    cart["total"], cart["item_count"] = _compute_totals(cart["items"])
    await _broadcast(cart_id, "cart_update", f"Removed {removed_name}")
    return _to_state(cart)


async def join_cart(cart_id: str, participant_name: str) -> Optional[CartState]:
    cart = _CARTS.get(cart_id)
    if not cart:
        return None
    if participant_name not in cart["participants"]:
        cart["participants"].append(participant_name)
        await _broadcast(cart_id, "participant_joined",
                         f"{participant_name} joined the cart 👋")
    return _to_state(cart)


async def leave_cart(cart_id: str, participant_name: str) -> Optional[CartState]:
    cart = _CARTS.get(cart_id)
    if not cart:
        return None
    if participant_name in cart["participants"]:
        cart["participants"].remove(participant_name)
        await _broadcast(cart_id, "participant_left",
                         f"{participant_name} left the cart")
    return _to_state(cart)


async def delete_cart(cart_id: str) -> bool:
    """Delete a cart entirely. Only the owner should call this."""
    cart = _CARTS.pop(cart_id, None)
    if not cart:
        return False
    # Notify all connected streams that the cart is gone
    payload = json.dumps({
        "type": "checkout",
        "cart": None,
        "message": "Cart has been deleted by the owner",
    })
    data = f"data: {payload}\n\n"
    for q in list(_STREAMS.get(cart_id, [])):
        try:
            q.put_nowait(data)
        except asyncio.QueueFull:
            pass
    _STREAMS.pop(cart_id, None)
    return True


async def stream_cart(cart_id: str):
    """
    Async generator that yields SSE text chunks.
    Registers a queue, yields events as they arrive, cleans up on disconnect.
    """
    cart = _CARTS.get(cart_id)
    if not cart:
        yield f"data: {json.dumps({'type': 'error', 'message': 'Cart not found'})}\n\n"
        return

    q: asyncio.Queue = asyncio.Queue(maxsize=50)
    _STREAMS.setdefault(cart_id, []).append(q)

    # Send current state immediately on connect
    state = _to_state(cart)
    yield f"data: {json.dumps({'type': 'cart_update', 'cart': state.model_dump(), 'message': 'Connected'})}\n\n"

    try:
        while True:
            try:
                chunk = await asyncio.wait_for(q.get(), timeout=25.0)
                yield chunk
            except asyncio.TimeoutError:
                # Heartbeat keeps connection alive through proxies
                yield ": heartbeat\n\n"
    finally:
        streams = _STREAMS.get(cart_id, [])
        if q in streams:
            streams.remove(q)
