from pydantic import BaseModel, ConfigDict
from typing import Optional


class ChatRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "summary": "Medicine query (voice/text)",
                    "value": {
                        "message": "I have a fever and headache, what should I take?",
                        "session_id": "sess-abc123",
                        "user_id": "user-001",
                    },
                },
                {
                    "summary": "Late-night hunger",
                    "value": {
                        "message": "I'm hungry, what snacks can I get in 30 mins?",
                        "session_id": "sess-xyz789",
                    },
                },
            ]
        }
    )

    message: str
    session_id: str
    user_id: Optional[str] = None


class SSEEvent(BaseModel):
    """Server-Sent Event chunk streamed back by the /chat endpoint."""

    type: str  # "text" | "products" | "error" | "done"
    delta: Optional[str] = None
    products: Optional[list] = None
    error: Optional[str] = None
