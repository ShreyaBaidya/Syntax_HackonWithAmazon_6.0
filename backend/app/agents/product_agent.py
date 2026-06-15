import json
from openai import OpenAI
from app.core.config import settings
from app.core.json_parser import safe_parse_json
from app.schemas.cart import BudgetTier, CartItem, ItemCategory


class ProductAgent:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.nvidia_api_key, base_url=settings.nvidia_base_url
            )
        return self._client

    async def build_cart_from_intent(
        self,
        intent_data: dict,
        query: str,
        budget_tier: BudgetTier = BudgetTier.STANDARD,
        dietary_preferences: list[str] = [],
    ) -> list[CartItem]:
        budget_context = {
            BudgetTier.BUDGET: "cheapest options",
            BudgetTier.STANDARD: "balance quality and price",
            BudgetTier.PREMIUM: "premium/organic options",
        }
        dietary_context = ""
        if dietary_preferences:
            dietary_context = f"\nDietary requirements (STRICTLY follow): {', '.join(dietary_preferences)}. Only include products that comply with ALL of these requirements. Exclude any product that contains restricted ingredients."
        prompt = f"""Build a shopping cart for: "{query}"
Intent: {json.dumps(intent_data)}
Budget: {budget_tier.value} - {budget_context[budget_tier]}{dietary_context}
Return ONLY a JSON array (8-15 items). Prices in Indian Rupees (INR).
Format: [{{"name":"Product","quantity":"1","category":"essential","estimated_price":299,"substitutes":["Alt1","Alt2"]}}]
Categories: essential, recommended, optional. No markdown. No explanations."""
        try:
            response = self.client.chat.completions.create(
                model=settings.nvidia_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Return ONLY valid JSON array. No markdown. Prices in INR.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
                max_tokens=2000,
            )
            text = response.choices[0].message.content or ""
            items_data = safe_parse_json(text, "ProductAgent", settings.nvidia_model)
            if not items_data or not isinstance(items_data, list):
                return []
            cart_items = []
            for item in items_data:
                if not isinstance(item, dict) or "name" not in item:
                    continue
                try:
                    cart_items.append(
                        CartItem(
                            name=item["name"],
                            quantity=item.get("quantity", "1"),
                            category=ItemCategory(item.get("category", "essential")),
                            estimated_price=item.get("estimated_price"),
                            substitute_available=len(item.get("substitutes", [])) > 0,
                            substitutes=item.get("substitutes", []),
                        )
                    )
                except (ValueError, KeyError):
                    continue
            return cart_items
        except Exception as e:
            print(f"[ProductAgent] ERROR: {e}")
            return []

    async def get_occasion_cart(
        self,
        occasion: str,
        guests: int = 2,
        budget_tier: BudgetTier = BudgetTier.STANDARD,
        dietary_preferences: list[str] = [],
    ) -> list[CartItem]:
        intent_data = {
            "intent_type": "occasion",
            "occasion": occasion,
            "servings": guests,
        }
        return await self.build_cart_from_intent(
            intent_data,
            f"{occasion.replace('_', ' ')} for {guests} people",
            budget_tier,
            dietary_preferences,
        )

    async def get_outcome_cart(
        self,
        goal: str,
        budget_tier: BudgetTier = BudgetTier.STANDARD,
        dietary_preferences: list[str] = [],
    ) -> list[CartItem]:
        intent_data = {"intent_type": "outcome_goal", "goal": goal}
        return await self.build_cart_from_intent(
            intent_data, goal, budget_tier, dietary_preferences
        )


product_agent = ProductAgent()
