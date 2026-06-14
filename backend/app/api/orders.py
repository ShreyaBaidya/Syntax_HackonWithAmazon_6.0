import uuid
import re
from datetime import datetime, timedelta

from fastapi import APIRouter, Query

from app.db.seed import PRODUCTS
from app.db.order_store import _ORDER_HISTORY
from app.models.order import OrderRequest, OrderResponse

router = APIRouter()


@router.post("/orders", response_model=OrderResponse)
async def place_order(request: OrderRequest):
    """
    Creates an order record and returns confirmation with ETA.
    DynamoDB persistence is best-effort — never blocks the response.
    """
    order_id = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:4].upper()}"

    # Calculate total from seed catalog prices
    total = sum(
        float(next((p["price"] for p in PRODUCTS if p["id"] == item.product_id), 0))
        * item.quantity
        for item in request.items
    )

    eta_minutes = 28
    estimated_delivery = (
        datetime.utcnow() + timedelta(minutes=eta_minutes)
    ).strftime("%Y-%m-%dT%H:%M:%SZ")

    created_at = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    order_record = {
        "order_id":         order_id,
        "user_id":          request.user_id,
        "items":            [i.model_dump() for i in request.items],
        "delivery_address": request.delivery_address,
        "status":           "confirmed",
        "total_amount":     round(total, 2),
        "eta_minutes":      eta_minutes,
        "estimated_delivery": estimated_delivery,
        "created_at":       created_at,
        "payment_method":   getattr(request, "payment_method", "UPI"),
    }

    # Always store in memory for the session
    _ORDER_HISTORY.append(order_record)

    # Persist order (non-blocking — local dev may not have DynamoDB)
    try:
        from app.db.dynamo import put_order
        put_order(order_record)
    except Exception:
        pass

    return OrderResponse(
        order_id=order_id,
        status="confirmed",
        estimated_delivery=estimated_delivery,
        eta_minutes=eta_minutes,
        total_amount=round(total, 2),
    )


@router.get("/orders")
async def get_order_history(user_id: str = Query(default="demo_user")):
    """
    Returns order history. Handles two formats:
    1. Flat format: list of order dicts with user_id (from place_order)
    2. Customer format: [{customer_id, orders: [{order_id, products, ...}]}]
    """
    result = []

    for entry in _ORDER_HISTORY:
        # ── Format 1: flat order dict (from place_order) ──────────────────
        if "order_id" in entry and "products" not in entry:
            if entry.get("user_id") == user_id:
                result.append(entry)

        # ── Format 2: customer wrapper with nested orders ─────────────────
        elif "customer_id" in entry and "orders" in entry:
            for order in entry.get("orders", []):
                products = order.get("products", [])
                date_str = order.get("order_date", "2026-01-01")
                time_str = order.get("order_time", "00:00:00")
                created_at = f"{date_str}T{time_str}Z"

                def clean_url(url: str) -> str:
                    """Extract plain URL from markdown [text](url) format."""
                    m = re.search(r'\(https?://[^\)]+\)', url)
                    if m:
                        return m.group()[1:-1]  # strip surrounding ( )
                    return url

                result.append({
                    "order_id":           order.get("order_id", ""),
                    "user_id":            user_id,
                    "status":             "confirmed",
                    "estimated_delivery": created_at,
                    "eta_minutes":        15,
                    "total_amount":       0.0,
                    "items": [
                        {
                            "product_id": p.get("product_id", ""),
                            "quantity":   p.get("quantity", 1),
                            "title":      p.get("title", ""),
                            "image_url":  clean_url(p.get("imageUrl", "")),
                            "brand":      p.get("brand", ""),
                            "category":   p.get("category", ""),
                        }
                        for p in products
                    ],
                    "delivery_address":  "Bengaluru",
                    "created_at":        created_at,
                    "payment_method":    order.get("payment_method", "UPI"),
                })

    # Most recent first
    result.sort(key=lambda o: o.get("created_at", ""), reverse=True)
    return {"orders": result, "total": len(result)}
