from pydantic import BaseModel, ConfigDict


class OrderItem(BaseModel):
    product_id: str
    quantity: int


class OrderRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "summary": "Single item order",
                    "value": {
                        "user_id": "user-001",
                        "items": [
                            {"product_id": "z0001", "quantity": 1},
                        ],
                        "delivery_address": "12-B, Koramangala 4th Block, Bengaluru 560034",
                    },
                },
                {
                    "summary": "Multi-item basket",
                    "value": {
                        "user_id": "user-042",
                        "items": [
                            {"product_id": "p001", "quantity": 2},
                            {"product_id": "z0004", "quantity": 1},
                            {"product_id": "z0277", "quantity": 3},
                        ],
                        "delivery_address": "Tower C, Cybercity, Gurugram 122002",
                    },
                },
            ]
        }
    )

    user_id: str
    items: list[OrderItem]
    delivery_address: str


class OrderResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "order_id": "ORD-20260613-A1B2",
                "status": "confirmed",
                "estimated_delivery": "2026-06-13T14:58:00Z",
                "eta_minutes": 28,
                "total_amount": 147.50,
            }
        }
    )

    order_id: str
    status: str
    estimated_delivery: str
    eta_minutes: int
    total_amount: float
