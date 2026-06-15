"""
Google Calendar Service
────────────────────────
Fetches events from a user's Google Calendar using OAuth2 tokens.

Two modes:
  1. OAuth2 (user-specific): requires access_token from frontend after Google login
  2. Service Account (demo): reads a shared demo calendar using a JSON key file
     Set GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CALENDAR_ID in .env

The service gracefully returns mock events if credentials are not configured,
so the rest of the app continues to work locally without any Google setup.
"""
from __future__ import annotations

import json
import os
from datetime import date, datetime, timezone
from typing import Optional

try:
    from zoneinfo import ZoneInfo
    _LOCAL_TZ = ZoneInfo(os.getenv("APP_TIMEZONE", "Asia/Kolkata"))
except Exception:  # pragma: no cover - fallback if tzdata missing
    _LOCAL_TZ = timezone.utc


# ── Helpers ───────────────────────────────────────────────────────────────────

def _day_range(date_str: Optional[str] = None) -> tuple[str, str]:
    """
    Return ISO-8601 start/end strings covering the full local day.

    Events are matched against the app's local timezone (default Asia/Kolkata)
    so that, e.g., an early-morning IST event isn't pushed onto the previous
    UTC day. The returned bounds are timezone-aware and accepted as-is by the
    Google Calendar API.
    """
    if date_str:
        try:
            d = date.fromisoformat(date_str)
        except ValueError:
            d = datetime.now(_LOCAL_TZ).date()
    else:
        d = datetime.now(_LOCAL_TZ).date()

    start = datetime(d.year, d.month, d.day, 0, 0, 0, tzinfo=_LOCAL_TZ)
    end   = datetime(d.year, d.month, d.day, 23, 59, 59, tzinfo=_LOCAL_TZ)
    return start.isoformat(), end.isoformat()


def _parse_event(item: dict) -> dict:
    """Normalise a Google Calendar event into our internal shape."""
    start_raw = item.get("start", {})
    start_str = start_raw.get("dateTime") or start_raw.get("date", "")
    time_str = ""
    if "T" in start_str:
        try:
            dt = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
            time_str = dt.strftime("%I:%M %p")   # e.g. "07:30 PM"
        except ValueError:
            pass

    return {
        "event_id":    item.get("id", ""),
        "title":       item.get("summary", "Untitled Event"),
        "description": item.get("description", ""),
        "time":        time_str,
        "location":    item.get("location", ""),
        "type":        _infer_type(item.get("summary", ""), item.get("description", "")),
    }


def _infer_type(title: str, description: str) -> str:
    """Guess event type from title/description keywords."""
    text = (title + " " + description).lower()
    if any(w in text for w in ["party", "birthday", "celebration", "get together", "gathering"]):
        return "party"
    if any(w in text for w in ["festival", "diwali", "holi", "eid", "christmas", "puja", "navratri"]):
        return "festival"
    if any(w in text for w in ["guest", "family", "relatives", "in-laws", "visit", "host"]):
        return "guest"
    if any(w in text for w in ["workout", "gym", "run", "yoga", "fitness", "marathon"]):
        return "workout"
    if any(w in text for w in ["sick", "unwell", "fever", "doctor", "hospital", "medicine"]):
        return "health"
    if any(w in text for w in ["travel", "trip", "flight", "train", "journey", "vacation"]):
        return "travel"
    if any(w in text for w in ["office", "work", "meeting", "conference", "presentation"]):
        return "work"
    return "general"


# ── Mock events for local dev / demo ─────────────────────────────────────────

_MOCK_EVENTS: list[dict] = [
    {
        "event_id":    "mock_001",
        "title":       "House Party 🎉",
        "description": "10 friends coming over for dinner and drinks",
        "time":        "07:00 PM",
        "location":    "Home",
        "type":        "party",
    },
]


# ── OAuth2 mode (user token from frontend) ────────────────────────────────────

def fetch_events_with_token(access_token: str, date_str: Optional[str] = None) -> list[dict]:
    """
    Fetch calendar events using a user's OAuth2 access token.
    Call this when the user has connected their Google account.
    """
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build

        creds = Credentials(token=access_token)
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        start, end = _day_range(date_str)

        result = service.events().list(
            calendarId="primary",
            timeMin=start,
            timeMax=end,
            singleEvents=True,
            orderBy="startTime",
            maxResults=10,
        ).execute()

        return [_parse_event(e) for e in result.get("items", [])]

    except Exception as exc:
        # Return empty list — event_planner handles missing events gracefully
        return []


# ── Service Account mode (shared demo calendar) ───────────────────────────────

def fetch_events_service_account(date_str: Optional[str] = None) -> list[dict]:
    """
    Fetch events from a shared demo calendar using a Service Account JSON key.
    Requires GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CALENDAR_ID in .env
    """
    sa_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "")
    calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "")

    if not sa_json or not calendar_id:
        # Not configured — return mock events for demo
        return _MOCK_EVENTS

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        info = json.loads(sa_json) if sa_json.startswith("{") else json.load(open(sa_json))
        creds = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/calendar.readonly"],
        )
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        start, end = _day_range(date_str)

        result = service.events().list(
            calendarId=calendar_id,
            timeMin=start,
            timeMax=end,
            singleEvents=True,
            orderBy="startTime",
            maxResults=10,
        ).execute()

        items = result.get("items", [])
        return [_parse_event(e) for e in items] if items else _MOCK_EVENTS

    except Exception as exc:
        return _MOCK_EVENTS


# ── Public entry point ────────────────────────────────────────────────────────

def get_today_events(
    access_token: Optional[str] = None,
    date_str: Optional[str] = None,
) -> list[dict]:
    """
    Main entry. Uses OAuth token if provided, otherwise tries service account,
    falls back to mock events for local demo.
    """
    if access_token:
        return fetch_events_with_token(access_token, date_str)
    return fetch_events_service_account(date_str)
