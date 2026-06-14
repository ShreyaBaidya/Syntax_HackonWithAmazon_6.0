from openai import OpenAI
from app.core.config import settings
from app.core.json_parser import safe_parse_json

FALLBACK_INTENT = {"intent_type": "general_grocery", "meal_type": None, "servings": None, "occasion": None, "goal": None, "dietary_notes": [], "confidence": 0.5}


class IntentAgent:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = OpenAI(api_key=settings.nvidia_api_key, base_url=settings.nvidia_base_url)
        return self._client

    async def classify_intent(self, query: str) -> dict:
        prompt = f"""Analyze this user query and classify their shopping intent.
User query: "{query}"
Categories: meal_request, occasion, outcome_goal, general_grocery, recipe_based
Return ONLY valid JSON: {{"intent_type":"category","meal_type":"dish or null","servings":null,"occasion":null,"goal":null,"dietary_notes":[],"confidence":0.9}}"""
        try:
            response = self.client.chat.completions.create(
                model=settings.nvidia_model,
                messages=[
                    {"role": "system", "content": "Return ONLY valid JSON. No markdown. No explanations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3, max_tokens=500
            )
            text = response.choices[0].message.content or ""
            result = safe_parse_json(text, "IntentAgent", settings.nvidia_model)
            return result if result and isinstance(result, dict) else FALLBACK_INTENT
        except Exception as e:
            print(f"[IntentAgent] ERROR: {e}")
            return FALLBACK_INTENT


intent_agent = IntentAgent()
