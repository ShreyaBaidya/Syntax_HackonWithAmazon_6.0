import json
import os
from openai import OpenAI
from app.core.config import settings
from app.core.json_parser import safe_parse_json
from app.schemas.cart import CartItem, ItemCategory

# Vision models to try in order (free tier on NVIDIA)
VISION_MODELS = [
    "microsoft/phi-3.5-vision-instruct",
    "nvidia/llama-3.2-nv-vision-instruct-v1",
    "google/gemma-3-27b-it",
]


class VisionAgent:
    """Processes uploaded images and builds shopping carts."""

    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.nvidia_api_key, base_url=settings.nvidia_base_url
            )
        return self._client

    async def analyze_image(self, image_base64: str) -> dict:
        """Analyze image with vision model - tries multiple models. Has demo fallback."""

        # Demo mode for testing without API
        if os.getenv("VISION_DEMO_MODE"):
            return {
                "image_type": "fridge",
                "detected_items": [
                    {"name": "milk", "quantity": "1"},
                    {"name": "eggs", "quantity": "1"},
                    {"name": "butter", "quantity": "1"},
                    {"name": "cheese", "quantity": "1"},
                ],
                "missing_suggestions": [
                    "bread",
                    "pasta",
                    "olive oil",
                    "chicken breast",
                    "tomatoes",
                    "onions",
                    "garlic",
                    "yogurt",
                ],
                "meal_suggestions": ["cheese omelette", "pasta carbonara", "quick breakfast"],
            }

        prompt_text = """Look at this image carefully. Identify ALL food items, ingredients, groceries, or kitchen products visible.

Return ONLY valid JSON (no markdown, no explanation):
{"image_type":"fridge","detected_items":[{"name":"item name","quantity":"1"}],"missing_suggestions":["item that should be bought"],"meal_suggestions":["possible meal"]}
- image_type: fridge, food, recipe, shelf, or other
- detected_items: what you SEE in the image
- missing_suggestions: what's NOT there but would complement what is (10-15 suggestions)
- meal_suggestions: meals possible with detected + missing items"""

        # Try each vision model
        for model in VISION_MODELS:
            try:
                print(f"[VisionAgent] Trying vision model: {model}")
                response = self.client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt_text},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    },
                                },
                            ],
                        }
                    ],
                    temperature=0.3,
                    max_tokens=1200,
                )
                text = response.choices[0].message.content or ""
                print(f"[VisionAgent] Got response from {model}: {text[:200]}")

                result = safe_parse_json(text, "VisionAgent", model)
                if (
                    result
                    and isinstance(result, dict)
                    and len(result.get("detected_items", [])) > 0
                ):
                    print(
                        f"[VisionAgent] SUCCESS with {model} - detected {len(result['detected_items'])} items"
                    )
                    return result

            except Exception as e:
                print(f"[VisionAgent] {model} failed: {type(e).__name__}: {e}")
                continue

        # All vision models failed - use text model with image description request
        print("[VisionAgent] All vision models failed, using text-based fallback")
        return {
            "image_type": "other",
            "detected_items": [],
            "missing_suggestions": [],
            "meal_suggestions": [],
        }

    async def image_to_cart(self, image_base64: str) -> list[CartItem]:
        """Convert image to shopping cart - always produces results."""
        analysis = await self.analyze_image(image_base64)

        detected = analysis.get("detected_items", [])
        missing = analysis.get("missing_suggestions", [])
        meals = analysis.get("meal_suggestions", [])

        # If vision worked and found items, use them
        if detected or missing:
            prompt = f"""A user photographed their kitchen/fridge. Here's what was found:

Already have: {json.dumps(detected)}
Missing/Needed: {json.dumps(missing)}
Possible meals: {json.dumps(meals)}

Build a shopping cart of 8-12 items they should BUY. Focus on the MISSING items.
Prices in Indian Rupees (INR).

Return ONLY valid JSON array. No markdown. No text.
[{{"name":"Product Name","quantity":"1","category":"essential","estimated_price":149,"substitutes":["Alt1"]}}]
Categories: essential, recommended, optional"""
        else:
            # Vision completely failed - generate based on generic fridge photo
            prompt = """A user uploaded a photo of food/kitchen items but I couldn't analyze it.
Suggest a general Indian grocery shopping cart (10 items) with essentials that a typical household needs.
Prices in Indian Rupees (INR).

Return ONLY valid JSON array. No markdown. No text.
[{"name":"Product Name","quantity":"1","category":"essential","estimated_price":149,"substitutes":["Alt1"]}]
Categories: essential, recommended, optional"""

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
                max_tokens=1500,
            )
            text = response.choices[0].message.content or ""
            items_data = safe_parse_json(
                text, "VisionAgent.cart", settings.nvidia_model
            )

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

            print(f"[VisionAgent.cart] Built cart with {len(cart_items)} items")
            return cart_items

        except Exception as e:
            print(f"[VisionAgent.cart] ERROR: {e}")
            return []


vision_agent = VisionAgent()
