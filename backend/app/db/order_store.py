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
"customers": [
{
"customer_id": "C001",
"user_id": "user_001",
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
},
{
"customer_id": "C002",
"user_id": "user_002",
"customer_type": "Family",
"orders": [
{
"order_id": "ORD2001",
"order_date": "2026-04-02",
"order_time": "09:00:00",
"delievered_time": "09:18:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-GRO-04710",
"title": "Aashirvaad Premium Basmati Rice Long Grain, 10kg",
"brand": "Aashirvaad",
"category": "Groceries",
"imageUrl": "[https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-GRO-04719",
"title": "India Gate Shudh Chakki Whole Wheat Atta, 5kg",
"brand": "India Gate",
"category": "Groceries",
"imageUrl": "[https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-GRO-04894",
"title": "Tata Sampann Premium Garam Masala Blend, 50g",
"brand": "Tata Sampann",
"category": "Groceries",
"imageUrl": "[https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 4
},
{
"product_id": "AMZ-DAI-00970",
"title": "Eggoz Quail Eggs Elite Pack, 30 Pack",
"brand": "Eggoz",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD2002",
"order_date": "2026-04-07",
"order_time": "17:45:00",
"delievered_time": "18:02:00",
"payment_method": "Credit Card",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 6
},
{
"product_id": "AMZ-FRE-01020",
"title": "Fresho Fresh Hybrid Tomato, 5kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01012",
"title": "Fresho Green Chilled Capsicum, 2kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00519",
"title": "Prataap Snacks Aloo Bhujia, 150g",
"brand": "Prataap Snacks",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD2003",
"order_date": "2026-04-10",
"order_time": "10:30:00",
"delievered_time": "10:48:00",
"payment_method": "Debit Card",
"products": [
{
"product_id": "AMZ-BAB-02694",
"title": "MamyPoko Premium Soft Care Diapers, M - 42 Pack",
"brand": "MamyPoko",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-BAB-03000",
"title": "Slurrp Farm Wheat Apple Baby Cereal Stage 1 Variant-4, 400g",
"brand": "Slurrp Farm",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-BAB-02873",
"title": "Johnson's Baby No More Tears Baby Shampoo Variant-4, 200g",
"brand": "Johnson's Baby",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD2004",
"order_date": "2026-04-17",
"order_time": "08:20:00",
"delievered_time": "08:37:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 4
},
{
"product_id": "AMZ-DAI-00975",
"title": "UPF Quail Eggs Elite Pack, 30 Pack",
"brand": "UPF",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01110",
"title": "Local Farms Fresh Cauliflower Head, 2kg",
"brand": "Local Farms",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1568584711271-e30574906fa8?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1568584711271-e30574906fa8?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-PRO-02340",
"title": "Tide Matic Front Load Powder, 2kg",
"brand": "Tide",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-PRO-02632",
"title": "Domex Disinfectant Toilet Cleaner Liquid, 200ml",
"brand": "Domex",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1563453392-2993175fe53a?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1563453392-2993175fe53a?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD2005",
"order_date": "2026-04-21",
"order_time": "16:50:00",
"delievered_time": "17:09:00",
"payment_method": "Credit Card",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 5
},
{
"product_id": "AMZ-FRE-01171",
"title": "Del Monte Kiwi Fruit imported, 1 unit",
"brand": "Del Monte",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1585056801043-1a0aa0c1268c?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1585056801043-1a0aa0c1268c?auto=format&fit=crop&w=600&q=80)",
"quantity": 4
},
{
"product_id": "AMZ-SNA-00519",
"title": "Prataap Snacks Aloo Bhujia, 150g",
"brand": "Prataap Snacks",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80)",
"quantity": 3
}
]
},
{
"order_id": "ORD2006",
"order_date": "2026-04-26",
"order_time": "11:15:00",
"delievered_time": "11:35:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 4
},
{
"product_id": "AMZ-FRE-01020",
"title": "Fresho Fresh Hybrid Tomato, 5kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-DAI-00831",
"title": "Britannia Cheese Slices Pack, 200g",
"brand": "Britannia",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1486297678162-ad2a14b34885?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1486297678162-ad2a14b34885?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00753",
"title": "Amul Garlic and Herbs Butter, 500g",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD2007",
"order_date": "2026-04-29",
"order_time": "20:10:00",
"delievered_time": "20:28:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-BAB-02694",
"title": "MamyPoko Premium Soft Care Diapers, M - 42 Pack",
"brand": "MamyPoko",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-BAB-02718",
"title": "Himalaya Baby 99% Pure Water Wipes Pack, L - 64 Pack",
"brand": "Himalaya Baby",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1608885898957-a599fb1b4a40?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1608885898957-a599fb1b4a40?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD2008",
"order_date": "2026-05-05",
"order_time": "09:40:00",
"delievered_time": "09:56:00",
"payment_method": "Debit Card",
"products": [
{
"product_id": "AMZ-GRO-04685",
"title": "Daawat Premium Basmati Rice Long Grain, 5kg",
"brand": "Daawat",
"category": "Groceries",
"imageUrl": "[https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-GRO-04719",
"title": "India Gate Shudh Chakki Whole Wheat Atta, 5kg",
"brand": "India Gate",
"category": "Groceries",
"imageUrl": "[https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-GRO-04898",
"title": "Tata Sampann Coriander (Dhania) Powder Ground, 50g",
"brand": "Tata Sampann",
"category": "Groceries",
"imageUrl": "[https://images.unsplash.com/photo-1588879460618-9249e7d947d1?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1588879460618-9249e7d947d1?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 6
}
]
},
{
"order_id": "ORD2009",
"order_date": "2026-05-09",
"order_time": "18:05:00",
"delievered_time": "18:22:00",
"payment_method": "Credit Card",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 4
},
{
"product_id": "AMZ-DAI-00970",
"title": "Eggoz Quail Eggs Elite Pack, 30 Pack",
"brand": "Eggoz",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01012",
"title": "Fresho Green Chilled Capsicum, 2kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1563565042-2411bcac563f?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00519",
"title": "Prataap Snacks Aloo Bhujia, 150g",
"brand": "Prataap Snacks",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD2010",
"order_date": "2026-05-14",
"order_time": "14:20:00",
"delievered_time": "14:38:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-BAB-02694",
"title": "MamyPoko Premium Soft Care Diapers, M - 42 Pack",
"brand": "MamyPoko",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-BAB-03000",
"title": "Slurrp Farm Wheat Apple Baby Cereal Stage 1 Variant-4, 400g",
"brand": "Slurrp Farm",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-MED-02088",
"title": "Savlon Antiseptic Ointment 5%, Box of 20",
"brand": "Savlon",
"category": "Medicines",
"imageUrl": "[https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD2011",
"order_date": "2026-05-18",
"order_time": "08:50:00",
"delievered_time": "09:05:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 4
},
{
"product_id": "AMZ-FRE-01020",
"title": "Fresho Fresh Hybrid Tomato, 5kg",
"brand": "Fresho",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-PRO-02340",
"title": "Tide Matic Front Load Powder, 2kg",
"brand": "Tide",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-PRO-02367",
"title": "Rin Fabric Conditioner Softener, 1L",
"brand": "Rin",
"category": "Product Cleaners",
"imageUrl": "[https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1610557892470-55d9e80e0b96?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD2012",
"order_date": "2026-05-22",
"order_time": "19:30:00",
"delievered_time": "19:48:00",
"payment_method": "Credit Card",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 6
},
{
"product_id": "AMZ-FRE-01171",
"title": "Del Monte Kiwi Fruit imported, 1 unit",
"brand": "Del Monte",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1585056801043-1a0aa0c1268c?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1585056801043-1a0aa0c1268c?auto=format&fit=crop&w=600&q=80)",
"quantity": 5
},
{
"product_id": "AMZ-DAI-00842",
"title": "Amul Cheese Slices Pack, 100g",
"brand": "Amul",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1486297678162-ad2a14b34885?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1486297678162-ad2a14b34885?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
},
{
"product_id": "AMZ-DAI-00749",
"title": "Delicious Unsalted Cooking Butter, 100g",
"brand": "Delicious",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
}
]
},
{
"order_id": "ORD2013",
"order_date": "2026-05-26",
"order_time": "10:05:00",
"delievered_time": "10:21:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00975",
"title": "UPF Quail Eggs Elite Pack, 30 Pack",
"brand": "UPF",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-FRE-01110",
"title": "Local Farms Fresh Cauliflower Head, 2kg",
"brand": "Local Farms",
"category": "Fresh",
"imageUrl": "[https://images.unsplash.com/photo-1568584711271-e30574906fa8?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1568584711271-e30574906fa8?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00519",
"title": "Prataap Snacks Aloo Bhujia, 150g",
"brand": "Prataap Snacks",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80)",
"quantity": 3
}
]
},
{
"order_id": "ORD2014",
"order_date": "2026-05-28",
"order_time": "17:15:00",
"delievered_time": "17:33:00",
"payment_method": "Debit Card",
"products": [
{
"product_id": "AMZ-GIF-04009",
"title": "Generic Decor Metallic Foil Birthday Banner Set, Standard",
"brand": "Generic Decor",
"category": "Gifts and Decorations",
"imageUrl": "[https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-SNA-00578",
"title": "Cadbury Dairy Milk Fruit and Nut Chocolate, 12g",
"brand": "Cadbury Dairy Milk",
"category": "Snacks",
"imageUrl": "[https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80)",
"quantity": 5
},
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
},
{
"order_id": "ORD2015",
"order_date": "2026-05-31",
"order_time": "09:25:00",
"delievered_time": "09:44:00",
"payment_method": "UPI",
"products": [
{
"product_id": "AMZ-DAI-00698",
"title": "Heritage Toned Milk Pouched, 1L",
"brand": "Heritage",
"category": "Dairy and Eggs",
"imageUrl": "[https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80)",
"quantity": 4
},
{
"product_id": "AMZ-BAB-02694",
"title": "MamyPoko Premium Soft Care Diapers, M - 42 Pack",
"brand": "MamyPoko",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80)",
"quantity": 1
},
{
"product_id": "AMZ-BAB-02899",
"title": "Nestum Multi Grain Fruits Stage 3, 200g",
"brand": "Nestum",
"category": "Baby Products",
"imageUrl": "[https://images.unsplash.com/photo-1596272875729-ed2f0d6991a0?auto=format&fit=crop&w=600&q=80](https://images.unsplash.com/photo-1596272875729-ed2f0d6991a0?auto=format&fit=crop&w=600&q=80)",
"quantity": 2
}
]
}
]
}
]
}]


# ── Lookup helpers ────────────────────────────────────────────────────────────

def get_customer_by_user_id(user_id: str) -> dict | None:
    """Return the customer record whose user_id matches, or None."""
    customers: list[dict] = _ORDER_HISTORY[0]["customers"]
    for customer in customers:
        if customer.get("user_id") == user_id:
            return customer
    return None


def get_orders_by_user_id(user_id: str) -> list[dict]:
    """Return the list of orders for a given user_id (empty list if not found)."""
    customer = get_customer_by_user_id(user_id)
    return customer["orders"] if customer else []
