from openai import OpenAI
from app.core.config import settings
from app.core.json_parser import safe_parse_json
from app.schemas.cart import NutritionInfo, CartItem


class NutritionAgent:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.nvidia_api_key, base_url=settings.nvidia_base_url
            )
        return self._client

    async def analyze_nutrition(self, items: list[CartItem]) -> NutritionInfo:
        items_text = ", ".join([item.name for item in items])
        prompt = f"""Estimate total nutrition for these items: {items_text}
Return ONLY valid JSON: {{"calories":2000,"protein":80,"carbs":250,"fat":60,"fiber":30}}
No markdown. No explanations."""
        try:
            response = self.client.chat.completions.create(
                model=settings.nvidia_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Return ONLY valid JSON. No markdown.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=200,
            )
            text = response.choices[0].message.content or ""
            data = safe_parse_json(text, "NutritionAgent", settings.nvidia_model)
            if data and isinstance(data, dict):
                return NutritionInfo(
                    calories=data.get("calories", 0),
                    protein=data.get("protein", 0),
                    carbs=data.get("carbs", 0),
                    fat=data.get("fat", 0),
                    fiber=data.get("fiber"),
                )
            return NutritionInfo()
        except Exception as e:
            print(f"[NutritionAgent] ERROR: {e}")
            return NutritionInfo()


nutrition_agent = NutritionAgent()
