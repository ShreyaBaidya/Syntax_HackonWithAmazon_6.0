from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.models.chat import ChatRequest
from app.services.intent_engine import stream_nowspeak

router = APIRouter()


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Accepts a user message (text or voice transcript).
    Returns a Server-Sent Events stream with text deltas and product cards.
    """
    return StreamingResponse(
        stream_nowspeak(
            message=request.message,
            session_id=request.session_id,
            user_id=request.user_id,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
