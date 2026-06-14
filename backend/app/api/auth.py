"""
Authentication API — email/password + mock Google OAuth.
Two demo users are seeded in-memory by default (no DB required).
"""
from __future__ import annotations

import hashlib
import secrets
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter()

# ── In-memory "database" ──────────────────────────────────────────────────────
# Passwords stored as SHA-256 hex (demo only — use bcrypt in production)

def _sha256(plain: str) -> str:
    return hashlib.sha256(plain.encode()).hexdigest()


_USERS: dict[str, dict] = {
    "user_001": {
        "user_id": "user_001",
        "customer_id": "C001",          # links to order_store._ORDER_HISTORY customer C001
        "name": "Ravi Kumar",
        "email": "ravi@example.com",
        "password_hash": _sha256("Amazon@123"),
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ravi",
        "phone": "+91 98765 43210",
    },
    "user_002": {
        "user_id": "user_002",
        "customer_id": "C002",          # links to order_store._ORDER_HISTORY customer C002
        "name": "Shreya",
        "email": "shreya",
        "password_hash": _sha256("Prime#456"),
        "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
        "phone": "+91 91234 56789",
    },
}

# email → user_id index
_EMAIL_INDEX: dict[str, str] = {u["email"]: uid for uid, u in _USERS.items()}

# Simple token store  {token: user_id}
_TOKENS: dict[str, str] = {}


# ── Request / Response models ─────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    # In a real app this would be a Google ID token; here we accept a mock email
    google_email: str
    google_name: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user_id: str
    name: str
    email: str
    avatar: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _issue_token(user_id: str) -> str:
    token = f"{secrets.token_hex(24)}"
    _TOKENS[token] = user_id
    return token


def _user_response(user: dict) -> AuthResponse:
    token = _issue_token(user["user_id"])
    return AuthResponse(
        token=token,
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
        avatar=user["avatar"],
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=AuthResponse, summary="Email + password login")
async def login(body: LoginRequest):
    """Authenticate with email and password. Returns a session token."""
    uid = _EMAIL_INDEX.get(body.email.lower().strip())
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user = _USERS[uid]
    if user["password_hash"] != _sha256(body.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return _user_response(user)


@router.post("/auth/google", response_model=AuthResponse, summary="Mock Google OAuth login")
async def google_login(body: GoogleLoginRequest):
    """
    Mock Google OAuth — looks up the user by Google email.
    If the email matches a seeded user, logs them in.
    For a real app, verify the Google ID token here.
    """
    email = body.google_email.lower().strip()
    uid = _EMAIL_INDEX.get(email)

    if uid:
        # Known user — log them in
        return _user_response(_USERS[uid])

    # Auto-create a guest profile for unrecognised Google emails
    new_uid = f"google_{secrets.token_hex(6)}"
    name = body.google_name or email.split("@")[0].title()
    new_user = {
        "user_id": new_uid,
        "name": name,
        "email": email,
        "password_hash": "",          # Google users have no password
        "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={name}",
        "phone": "",
    }
    _USERS[new_uid] = new_user
    _EMAIL_INDEX[email] = new_uid
    return _user_response(new_user)


@router.get("/auth/me", summary="Get current user from token")
async def me(token: str):
    """Validate a token and return the user profile."""
    uid = _TOKENS.get(token)
    if not uid or uid not in _USERS:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = _USERS[uid]
    return {"user_id": user["user_id"], "name": user["name"], "email": user["email"], "avatar": user["avatar"]}


@router.get("/auth/seed-users", summary="List demo users (dev helper)")
async def seed_users():
    """Returns the two pre-seeded demo user credentials (no passwords)."""
    return [
        {"email": u["email"], "name": u["name"], "hint": "see backend/app/api/auth.py for password"}
        for u in _USERS.values()
    ]
