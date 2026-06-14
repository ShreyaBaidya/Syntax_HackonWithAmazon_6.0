from typing import List, Optional
from pydantic import BaseModel


class ProfileObject(BaseModel):
    """User's dietary and allergen preferences."""
    diet_tags: List[str] = []
    allergen_tags: List[str] = []
    custom_exclusions: str = ""


class ProfileCreateRequest(BaseModel):
    """Request body for creating or updating a dietary profile."""
    user_id: Optional[str] = None
    profile: ProfileObject


class ProfileResponse(BaseModel):
    """Response returned after profile creation or retrieval."""
    user_id: str
    profile: ProfileObject
    exclusion_set: List[str]
