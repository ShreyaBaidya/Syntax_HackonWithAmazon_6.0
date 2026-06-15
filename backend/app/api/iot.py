from fastapi import APIRouter
from typing import Dict

router = APIRouter()

# Dummy data simulating a Smart Refrigerator's inventory sensors
MOCK_FRIDGE_STATE = {
    "expected_inventory": {
        "milk": {"name": "Amul Full Cream Milk 1L", "qty": 2, "catalog_id": "p011"},
        "eggs": {
            "name": "Farm Fresh Eggs 6pcs",
            "qty": 1,
            "catalog_id": "p022",
        },  # Assuming p022 or we map it
        "butter": {"name": "Amul Butter 100g", "qty": 1, "catalog_id": "p013"},
        "juice": {
            "name": "Minute Maid Orange Juice 1L",
            "qty": 1,
            "catalog_id": "p008",
        },
    },
    "current_inventory": {
        "milk": 0.2,  # 20% left (nearly empty)
        "eggs": 1,  # fully stocked
        "butter": 0,  # completely empty
        "juice": 0.8,  # mostly full
    },
}


@router.get("/iot/fridge/status")
async def get_fridge_status() -> Dict:
    """
    Simulates an IoT ping from a smart refrigerator.
    Compares current sensor weight/volume to expected inventory
    and returns an automated 'needs refill' cart.
    """
    needs_refill = []

    for item_key, expected in MOCK_FRIDGE_STATE["expected_inventory"].items():
        current_level = MOCK_FRIDGE_STATE["current_inventory"].get(item_key, 0)

        # If item is below 25% threshold, flag it for auto-refill
        if current_level < 0.25:
            needs_refill.append(
                {
                    "id": expected["catalog_id"],
                    "name": expected["name"],
                    "suggested_qty": expected["qty"],
                    "reason": f"Sensor detects {int(current_level * 100)}% remaining.",
                }
            )

    return {
        "status": "online",
        "last_sync": "Just now",
        "alerts": len(needs_refill),
        "auto_cart": needs_refill,
    }
