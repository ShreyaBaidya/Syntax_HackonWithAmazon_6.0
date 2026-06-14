"""
In-memory order store.

This module holds the single source of truth for order history during
the app's lifetime. Import _ORDER_HISTORY from here anywhere you need
to read or write orders — never redefine it in another module.

Usage:
    from app.db.order_store import _ORDER_HISTORY

    # Write
    _ORDER_HISTORY.append(order_record)

    # Read
    user_orders = [o for o in _ORDER_HISTORY if o["user_id"] == user_id]

Note:
    All data is lost on server restart (in-memory only).
    Swap this for DynamoDB / RDS when moving to production.
"""
from __future__ import annotations

# Single in-memory list shared across all imports in the same process.
# List is mutable, so mutations (append, pop, clear) are visible everywhere.
_ORDER_HISTORY: list[dict] = [
{
"customer_id": "C001",
"customer_type": "Working Professional",
"orders": [
{
"order_id": "ORD1001",
"order_date": "2026-04-03",
"order_time": "08:30:00",
"delievered_time": "08:45:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00681",
"title": "Amul Lactose Free Milk, 500ml",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-FRE-01128",
"title": "Fresho Nagpur Orange Sweet, 1kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01024",
"title": "Grown Out Lady Finger / Okra, 500g",
"brand": "Grown Out",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-PRO-02393",
"title": "Tide Matic Front Load Powder, 1L",
"brand": "Tide",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-PRO-02514",
"title": "Vim Dishwash Bar Anti-Smell, 250ml",
"brand": "Vim",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1585951237318-9ea5e175b891?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1585951237318-9ea5e175b891?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD1002",
"order_date": "2026-04-06",
"order_time": "19:15:00",
"delievered_time": "19:32:00",
"payment_method": "Credit Card",
"products": [
{
"product_id": "AMZ-DAI-00681",
"title": "Amul Lactose Free Milk, 500ml",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00976",
"title": "UPF Brown Organic Eggs Pack, 10 Pack",
"brand": "UPF",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-BEV-00263",
"title": "Sleepy Owl Classic Roasted Coffee Beans, 250g",
"brand": "Sleepy Owl",
"category": "Beverages",
"imageUrl": "[https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00413",
"title": "Parle Oreo Original Cream, 200g",
"brand": "Parle",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD1003",
"order_date": "2026-04-12",
"order_time": "07:45:00",
"delievered_time": "08:00:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00671",
"title": "Nandini Lactose Free Milk, 1L",
"brand": "Nandini",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-FRE-01128",
"title": "Fresho Nagpur Orange Sweet, 1kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01106",
"title": "Local Farms Green Chilled Capsicum, 500g",
"brand": "Local Farms",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00392",
"title": "Doritos Nacho Cheese Crisps, 130g",
"brand": "Doritos",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1613919189190-e479374dbd03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1613919189190-e479374dbd03?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD1004",
"order_date": "2026-04-16",
"order_time": "21:05:00",
"delievered_time": "21:20:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00671",
"title": "Nandini Lactose Free Milk, 1L",
"brand": "Nandini",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-MED-02188",
"title": "Dolo Cough Lozenges Ginger Strip, 1 unit",
"brand": "Dolo",
"category": "Medicines",
"imageUrl": "[https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00413",
"title": "Parle Oreo Original Cream, 200g",
"brand": "Parle",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1005",
"order_date": "2026-04-21",
"order_time": "18:50:00",
"delievered_time": "19:08:00",
"payment_method": "Credit Card",
"products": [
{
"product_id": "AMZ-DAI-00681",
"title": "Amul Lactose Free Milk, 500ml",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00989",
"title": "Hen Fruit Brown Organic Eggs Pack Variant-3, 6 Pack",
"brand": "Hen Fruit",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01024",
"title": "Grown Out Lady Finger / Okra, 500g",
"brand": "Grown Out",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1006",
"order_date": "2026-04-24",
"order_time": "09:10:00",
"delievered_time": "09:25:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-BEV-00263",
"title": "Sleepy Owl Classic Roasted Coffee Beans, 250g",
"brand": "Sleepy Owl",
"category": "Beverages",
"imageUrl": "[https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00652",
"title": "Maggi Upma Instant Bowl, 70g",
"brand": "Maggi",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80)",
"quantity": 3
},
{
"product_id": "AMZ-SNA-00413",
"title": "Parle Oreo Original Cream, 200g",
"brand": "Parle",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1007",
"order_date": "2026-04-30",
"order_time": "19:40:00",
"delievered_time": "19:55:00",
"payment_method": "Cash on Delivery",
"products": [
{
"product_id": "AMZ-DAI-00681",
"title": "Amul Lactose Free Milk, 500ml",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-FRE-01128",
"title": "Fresho Nagpur Orange Sweet, 1kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01106",
"title": "Local Farms Green Chilled Capsicum, 500g",
"brand": "Local Farms",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1008",
"order_date": "2026-05-04",
"order_time": "20:20:00",
"delievered_time": "20:38:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00671",
"title": "Nandini Lactose Free Milk, 1L",
"brand": "Nandini",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-PRO-02393",
"title": "Tide Matic Front Load Powder, 1L",
"brand": "Tide",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-PRO-02514",
"title": "Vim Dishwash Bar Anti-Smell, 250ml",
"brand": "Vim",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1585951237318-9ea5e175b891?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1585951237318-9ea5e175b891?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-ELE-03279",
"title": "Panasonic Extension Board 4-Socket Spike Guard, 4 Pack",
"brand": "Panasonic",
"category": "Electronics",
"imageUrl": "[https://images.unsplash.com/photo-1626012648785-555e3ba019a3?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1626012648785-555e3ba019a3?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1009",
"order_date": "2026-05-09",
"order_time": "08:15:00",
"delievered_time": "08:31:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00681",
"title": "Amul Lactose Free Milk, 500ml",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00976",
"title": "UPF Brown Organic Eggs Pack, 10 Pack",
"brand": "UPF",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00364",
"title": "Doritos American Style Cream & Onion, 130g",
"brand": "Doritos",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1618265321350-40591dfaf8f1?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1618265321350-40591dfaf8f1?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD1010",
"order_date": "2026-05-12",
"order_time": "17:30:00",
"delievered_time": "17:47:00",
"payment_method": "Credit Card",
"products": [
{
"product_id": "AMZ-FRE-01128",
"title": "Fresho Nagpur Orange Sweet, 1kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01024",
"title": "Grown Out Lady Finger / Okra, 500g",
"brand": "Grown Out",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1011",
"order_date": "2026-05-18",
"order_time": "07:55:00",
"delievered_time": "08:12:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00671",
"title": "Nandini Lactose Free Milk, 1L",
"brand": "Nandini",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-BEV-00206",
"title": "Red Label Classic Roasted Coffee Beans, 250g",
"brand": "Red Label",
"category": "Beverages",
"imageUrl": "[https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00413",
"title": "Parle Oreo Original Cream, 200g",
"brand": "Parle",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD1012",
"order_date": "2026-05-23",
"order_time": "19:00:00",
"delievered_time": "19:16:00",
"payment_method": "Cash on Delivery",
"products": [
{
"product_id": "AMZ-DAI-00681",
"title": "Amul Lactose Free Milk, 500ml",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00976",
"title": "UPF Brown Organic Eggs Pack, 10 Pack",
"brand": "UPF",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01106",
"title": "Local Farms Green Chilled Capsicum, 500g",
"brand": "Local Farms",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1013",
"order_date": "2026-05-25",
"order_time": "22:15:00",
"delievered_time": "22:30:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-MED-02131",
"title": "Moov Pain Relief Gel Tube, 10g",
"brand": "Moov",
"category": "Medicines",
"imageUrl": "[https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550572017-edd951aa8f72?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00652",
"title": "Maggi Upma Instant Bowl, 70g",
"brand": "Maggi",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD1014",
"order_date": "2026-05-29",
"order_time": "08:40:00",
"delievered_time": "08:58:00",
"payment_method": "UPI",
"products": [
    {
"product_id": "AMZ-DAI-00671",
"title": "Nandini Lactose Free Milk, 1L",
"brand": "Nandini",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00671",
"title": "Nandini Lactose Free Milk, 1L",
"brand": "Nandini",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-FRE-01128",
"title": "Fresho Nagpur Orange Sweet, 1kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610832958506-aa56338406ed?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01024",
"title": "Grown Out Lady Finger / Okra, 500g",
"brand": "Grown Out",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1625943554160-59be91093155?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00589",
"title": "Ferrero Rocher Dark Chocolate 75%, 12g",
"brand": "Ferrero Rocher",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD1015",
"order_date": "2026-05-31",
"order_time": "18:25:00",
"delievered_time": "18:41:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00681",
"title": "Amul Lactose Free Milk, 500ml",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00413",
"title": "Parle Oreo Original Cream, 200g",
"brand": "Parle",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
}
]
}]
