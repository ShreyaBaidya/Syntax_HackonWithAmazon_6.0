from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import StreamingResponse

from app.models.cart import (
    AddItemRequest,
    CartState,
    CreateCartRequest,
    JoinCartRequest,
    UpdateQtyRequest,
)
from app.services import cart_service

router = APIRouter()


@router.post(
    "/cart",
    response_model=CartState,
    description="Creates a shared cart and returns the `cart_id`. Share `GET /cart/{cart_id}` URL with friends.",
    tags=["Shared Cart"],
)
async def create_cart(body: CreateCartRequest = None):
    if body is None:
        body = CreateCartRequest()
    return cart_service.create_cart(body.participant_name or "You")


@router.get(
    "/cart/{cart_id}",
    response_model=CartState,
    summary="Get current cart state",
    tags=["Shared Cart"],
)
async def get_cart(cart_id: str = Path(..., description="6-char cart ID e.g. ABC123")):
    state = cart_service.get_cart(cart_id.upper())
    if not state:
        raise HTTPException(status_code=404, detail="Cart not found")
    return state


@router.post(
    "/cart/{cart_id}/join",
    response_model=CartState,
    summary="Join an existing cart as a participant",
    tags=["Shared Cart"],
)
async def join_cart(
    body: JoinCartRequest,
    cart_id: str = Path(...),
):
    state = await cart_service.join_cart(cart_id.upper(), body.participant_name)
    if not state:
        raise HTTPException(status_code=404, detail="Cart not found")
    return state


@router.post(
    "/cart/{cart_id}/items",
    response_model=CartState,
    summary="Add a product to the shared cart",
    description="Adds a product by ID. Increments quantity if already in cart. Broadcasts update to all participants via SSE.",
    tags=["Shared Cart"],
)
async def add_item(
    body: AddItemRequest,
    cart_id: str = Path(...),
):
    state = await cart_service.add_item(
        cart_id.upper(),
        body.product_id,
        body.participant_name,
        body.quantity,
    )
    if not state:
        raise HTTPException(status_code=404, detail="Cart or product not found")
    return state


@router.patch(
    "/cart/{cart_id}/items/{product_id}",
    response_model=CartState,
    summary="Update item quantity (0 = remove)",
    tags=["Shared Cart"],
)
async def update_item(
    body: UpdateQtyRequest,
    cart_id: str = Path(...),
    product_id: str = Path(...),
):
    state = await cart_service.update_quantity(
        cart_id.upper(), product_id, body.quantity
    )
    if not state:
        raise HTTPException(status_code=404, detail="Cart or item not found")
    return state


@router.delete(
    "/cart/{cart_id}/items/{product_id}",
    response_model=CartState,
    summary="Remove an item from the shared cart",
    tags=["Shared Cart"],
)
async def remove_item(
    cart_id: str = Path(...),
    product_id: str = Path(...),
):
    state = await cart_service.remove_item(cart_id.upper(), product_id)
    if not state:
        raise HTTPException(status_code=404, detail="Cart not found")
    return state


@router.get(
    "/cart/{cart_id}/stream",
    summary="SSE stream — real-time cart updates",
    description=(
        "⚠️ **Cannot be tested in Swagger UI** — SSE connections never close, "
        "so Swagger hangs indefinitely waiting for the response to finish.\n\n"
        "**Test with curl instead:**\n"
        "```\ncurl -N http://localhost:8000/api/v1/cart/{cart_id}/stream\n```\n"
        "Or open the URL directly in a browser tab.\n\n"
        "---\n\n"
        "Persistent connection that pushes JSON events whenever the cart changes. "
        "On connect, immediately receives the current cart state.\n\n"
        "**Event types:** `cart_update` · `participant_joined` · `participant_left` · `checkout`\n\n"
        "**Each event shape:** `{ type, cart: CartState, message }`"
    ),
    tags=["Shared Cart"],
)
async def cart_stream(cart_id: str = Path(...)):
    return StreamingResponse(
        cart_service.stream_cart(cart_id.upper()),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":       "keep-alive",
        },
    )
