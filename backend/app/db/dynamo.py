"""DynamoDB client wrapper for products and orders tables."""
import boto3
from boto3.dynamodb.conditions import Attr

from __MACOSX.urgentShopping.urgentShopping.backend.app.core.config import settings

_dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
_products_table = _dynamodb.Table(settings.dynamodb_products_table)
_orders_table = _dynamodb.Table(settings.dynamodb_orders_table)


def search_products_by_category(category: str, limit: int = 10) -> list[dict]:
    response = _products_table.scan(
        FilterExpression=Attr("category").eq(category) & Attr("in_stock").eq(True),
        Limit=limit * 3,  # over-fetch then trim — DynamoDB Limit is pre-filter
    )
    return response.get("Items", [])[:limit]


def search_products_by_query(query: str, limit: int = 10) -> list[dict]:
    query_lower = query.lower()
    response = _products_table.scan(
        FilterExpression=Attr("in_stock").eq(True),
    )
    items = response.get("Items", [])
    matched = [
        item for item in items
        if query_lower in item.get("name", "").lower()
        or query_lower in item.get("tags", "").lower()
        or query_lower in item.get("category", "").lower()
    ]
    return matched[:limit]


def get_user_orders(user_id: str, limit: int = 5) -> list[dict]:
    response = _orders_table.scan(
        FilterExpression=Attr("user_id").eq(user_id),
    )
    return response.get("Items", [])[:limit]


def put_order(order: dict) -> None:
    _orders_table.put_item(Item=order)
