from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    unit: str
    image_url: str
    category: str
    quantity: int
    added_by: List[str]  # all participants who added this item


class CartState(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "cart_id": "ABC123",
            "items": {},
            "participants": ["You"],
            "total": 0.0,
            "item_count": 0,
            "created_at": "2026-06-13T14:00:00Z",
        }
    })

    cart_id: str
    items: Dict[str, CartItem]
    participants: List[str]
    total: float
    item_count: int
    created_at: str


# ── Request bodies ────────────────────────────────────────────────────────────

class CreateCartRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {"participant_name": "Rahul 🛒"}
    })
    participant_name: Optional[str] = "You"


class AddItemRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "product_id": "z0001",
            "participant_name": "Rahul",
            "quantity": 1,
        }
    })
    product_id: str
    participant_name: str
    quantity: int = 1


class UpdateQtyRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {"quantity": 3}
    })
    quantity: int


class JoinCartRequest(BaseModel):
    model_config = ConfigDict(json_schema_extra={
        "example": {"participant_name": "Priya 🎉"}
    })
    participant_name: str


# ── SSE event sent to all cart participants ───────────────────────────────────

class CartSSEEvent(BaseModel):
    """
    Streamed to every connected participant when the cart changes.
    type: "cart_update" | "participant_joined" | "participant_left" | "checkout"
    """
    type: str
    cart: Optional[CartState] = None
    message: Optional[str] = None
