import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter

from app.db.seed import PRODUCTS
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

    # Persist order (non-blocking — local dev may not have DynamoDB)
    try:
        from app.db.dynamo import put_order
        put_order({
            "order_id":         order_id,
            "user_id":          request.user_id,
            "items":            [i.model_dump() for i in request.items],
            "delivery_address": request.delivery_address,
            "status":           "confirmed",
            "total_amount":     round(total, 2),
            "eta_minutes":      eta_minutes,
            "created_at":       datetime.utcnow().isoformat(),
        })
    except Exception:
        pass

    return OrderResponse(
        order_id=order_id,
        status="confirmed",
        estimated_delivery=estimated_delivery,
        eta_minutes=eta_minutes,
        total_amount=round(total, 2),
    )
