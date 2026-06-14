from pydantic import BaseModel
from typing import Optional
from enum import Enum


class BudgetTier(str, Enum):
    BUDGET = "budget"
    STANDARD = "standard"
    PREMIUM = "premium"


class ItemCategory(str, Enum):
    ESSENTIAL = "essential"
    RECOMMENDED = "recommended"
    OPTIONAL = "optional"


class CartItem(BaseModel):
    name: str
    quantity: str
    category: ItemCategory = ItemCategory.ESSENTIAL
    estimated_price: Optional[float] = None
    substitute_available: bool = False
    substitutes: list[str] = []


class NutritionInfo(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: Optional[float] = None


class CartResponse(BaseModel):
    intent: str
    description: str
    items: list[CartItem]
    total_estimated_price: Optional[float] = None
    nutrition: Optional[NutritionInfo] = None
    budget_tier: BudgetTier = BudgetTier.STANDARD


class IntentRequest(BaseModel):
    query: str
    budget_tier: BudgetTier = BudgetTier.STANDARD
    dietary_preferences: list[str] = []


class URLPromptRequest(BaseModel):
    url: str
    prompt: Optional[str] = None
    budget_tier: BudgetTier = BudgetTier.STANDARD


class OccasionType(str, Enum):
    SICK_DAY = "sick_day"
    GAME_NIGHT = "game_night"
    MOVIE_NIGHT = "movie_night"
    HOUSE_PARTY = "house_party"
    BIRTHDAY = "birthday"
    DATE_NIGHT = "date_night"
    OFFICE_LUNCH = "office_lunch"
    QUICK_BREAKFAST = "quick_breakfast"


class OccasionRequest(BaseModel):
    occasion: OccasionType
    guests: int = 2
    budget_tier: BudgetTier = BudgetTier.STANDARD
    dietary_preferences: list[str] = []


class OutcomeRequest(BaseModel):
    goal: str
    budget_tier: BudgetTier = BudgetTier.STANDARD
    dietary_preferences: list[str] = []
