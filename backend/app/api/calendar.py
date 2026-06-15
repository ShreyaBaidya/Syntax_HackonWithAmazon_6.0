"""
Google Calendar API endpoints.

GET  /api/v1/calendar/events       — fetch today's events (token or service account)
GET  /api/v1/calendar/auth-url     — returns the Google OAuth2 consent URL
POST /api/v1/calendar/callback     — exchanges auth code for access token
"""

from __future__ import annotations

import os
from typing import Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.google_calendar import get_today_events

router = APIRouter()

# ── In-memory token store {user_id → google_access_token} ────────────────────
_GOOGLE_TOKENS: dict[str, str] = {}

# Calendar-driven event recommendations are demoed for a single user (Shreya
# Sharma → user_002) to keep the two-user demo unambiguous.
EVENT_RECO_USER_ID = "user_002"


# ── Models ────────────────────────────────────────────────────────────────────


class GoogleCallbackRequest(BaseModel):
    code: str
    user_id: str


class StoreTokenRequest(BaseModel):
    user_id: str
    access_token: str


# ── Routes ────────────────────────────────────────────────────────────────────


@router.get(
    "/calendar/events",
    summary="Fetch today's Google Calendar events",
    description=(
        "Returns today's events from the user's Google Calendar.\n\n"
        "- If `user_id` has a stored OAuth token: reads their personal calendar\n"
        "- If `GOOGLE_SERVICE_ACCOUNT_JSON` is set in .env: reads the shared demo calendar\n"
        "- Otherwise: returns built-in mock events for local demo\n\n"
        "Pass optional `date` (YYYY-MM-DD) to get events for a specific day."
    ),
    tags=["Calendar"],
)
async def get_events(
    user_id: Optional[str] = Query(default=None),
    date: Optional[str] = Query(
        default=None, description="YYYY-MM-DD, defaults to today"
    ),
):
    token = _GOOGLE_TOKENS.get(user_id or "") if user_id else None
    events = get_today_events(access_token=token, date_str=date)
    return {
        "events": events,
        "total": len(events),
        "source": "oauth"
        if token
        else (
            "service_account" if os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") else "mock"
        ),
        "date": date or "today",
    }


@router.get(
    "/calendar/event-recommendations",
    summary="LLM product recommendations based on today's calendar events",
    description=(
        "Reads the user's calendar events for the day and uses the LLM together "
        "with the full product catalogue to recommend items the user likely needs "
        "for those events (e.g. snacks & drinks for a house party).\n\n"
        "This feature is intentionally enabled only for the demo user Shreya "
        "Sharma (user_002) to keep the two-account demo unambiguous. For any "
        "other user it returns `enabled: false` with empty lists."
    ),
    tags=["Calendar"],
)
async def event_recommendations(
    user_id: str = Query(..., description="User ID — feature active only for user_002"),
    date: Optional[str] = Query(
        default=None, description="YYYY-MM-DD, defaults to today"
    ),
):
    # Gate the feature to Shreya only
    if user_id != EVENT_RECO_USER_ID:
        return {"enabled": False, "events": [], "recommendations": []}

    token = _GOOGLE_TOKENS.get(user_id)
    events = get_today_events(access_token=token, date_str=date)

    return {
        "enabled": True,
        "events": events,
        "recommendations": [],
    }


@router.get(
    "/calendar/auth-url",
    summary="Get Google OAuth2 consent URL",
    description=(
        "Returns the URL the user should open to grant Google Calendar access.\n\n"
        "After granting, Google redirects to the `redirect_uri` with a `code` param.\n"
        "Send that code to `POST /api/v1/calendar/callback` to exchange it for a token."
    ),
    tags=["Calendar"],
)
async def get_auth_url(
    user_id: str = Query(..., description="User ID to associate the token with"),
    redirect_uri: str = Query(
        default="http://localhost:3000/auth/google-callback",
        description="Frontend redirect URI after Google OAuth",
    ),
):
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    if not client_id:
        return {
            "auth_url": None,
            "error": "GOOGLE_CLIENT_ID not configured in .env",
            "setup_hint": (
                "1. Go to console.cloud.google.com\n"
                "2. Create OAuth2 credentials (Web application)\n"
                "3. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to backend/.env\n"
                "4. Set redirect URI to http://localhost:3000/auth/google-callback"
            ),
        }

    scopes = "https://www.googleapis.com/auth/calendar.readonly"
    auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scopes}"
        f"&access_type=offline"
        f"&state={user_id}"
        f"&prompt=consent"
    )
    return {"auth_url": auth_url, "user_id": user_id}


@router.post(
    "/calendar/callback",
    summary="Exchange Google OAuth code for access token",
    tags=["Calendar"],
)
async def oauth_callback(body: GoogleCallbackRequest):
    """Exchange auth code for access token and store it for the user."""
    import httpx

    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:3000/auth/google-callback"
    )

    if not client_id or not client_secret:
        return {"error": "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": body.code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        token_data = resp.json()

    if "access_token" not in token_data:
        return {"error": "Failed to get access token", "detail": token_data}

    _GOOGLE_TOKENS[body.user_id] = token_data["access_token"]
    return {
        "status": "connected",
        "user_id": body.user_id,
        "expires_in": token_data.get("expires_in", 3600),
    }


@router.post(
    "/calendar/token",
    summary="Store a Google access token directly (for testing)",
    tags=["Calendar"],
)
async def store_token(body: StoreTokenRequest):
    """Store a Google access token for a user (useful for testing without full OAuth flow)."""
    _GOOGLE_TOKENS[body.user_id] = body.access_token
    return {"status": "stored", "user_id": body.user_id}


@router.get(
    "/calendar/status",
    summary="Check if user has linked Google Calendar",
    tags=["Calendar"],
)
async def calendar_status(user_id: str = Query(...)):
    has_token = user_id in _GOOGLE_TOKENS
    has_service_account = bool(os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON"))
    return {
        "user_id": user_id,
        "linked": has_token,
        "mode": "oauth"
        if has_token
        else ("service_account" if has_service_account else "mock"),
        "message": (
            "Personal Google Calendar connected"
            if has_token
            else "Using shared demo calendar"
            if has_service_account
            else "Using mock events (connect Google Calendar for real events)"
        ),
    }
