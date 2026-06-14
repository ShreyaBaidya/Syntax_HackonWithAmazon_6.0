from fastapi import APIRouter, HTTPException

from app.models.profile import ProfileCreateRequest, ProfileResponse
from app.services.profile_service import (
    save_profile,
    get_profile,
    DIET_TAG_EXCLUSIONS,
    ALLERGEN_TAG_EXCLUSIONS,
)

router = APIRouter()


@router.post("/profile", response_model=ProfileResponse)
async def create_or_update_profile(body: ProfileCreateRequest):
    """Create or update a dietary profile. Returns user_id for sessionStorage."""
    result = save_profile(
        user_id=body.user_id,
        diet_tags=body.profile.diet_tags,
        allergen_tags=body.profile.allergen_tags,
        custom_exclusions=body.profile.custom_exclusions,
    )
    return result


@router.get("/profile/mappings/diet")
async def get_diet_mappings():
    """Returns all diet tag → exclusion keyword mappings (for frontend display)."""
    return DIET_TAG_EXCLUSIONS


@router.get("/profile/mappings/allergens")
async def get_allergen_mappings():
    """Returns all allergen tag → exclusion keyword mappings."""
    return ALLERGEN_TAG_EXCLUSIONS


@router.get("/profile/{user_id}", response_model=ProfileResponse)
async def get_user_profile(user_id: str):
    """Retrieve a stored dietary profile."""
    entry = get_profile(user_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "user_id": user_id,
        "profile": entry["profile"],
        "exclusion_set": sorted(entry["exclusion_set"]),
    }
