import httpx
from bs4 import BeautifulSoup
from openai import OpenAI
from app.core.config import settings
from app.core.json_parser import safe_parse_json
from app.schemas.cart import CartItem, ItemCategory, BudgetTier

# Browser-like headers so websites don't block us
FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


class RecipeAgent:
    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None:
            self._client = OpenAI(
                api_key=settings.nvidia_api_key, base_url=settings.nvidia_base_url
            )
        return self._client

    async def fetch_url_content(self, url: str) -> dict:
        """Fetch URL content with proper browser headers."""
        try:
            async with httpx.AsyncClient(headers=FETCH_HEADERS, verify=False) as client:
                response = await client.get(url, follow_redirects=True, timeout=20.0)
                response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Remove non-content elements
            for tag in soup(
                ["script", "style", "nav", "footer", "header", "aside", "iframe"]
            ):
                tag.decompose()

            # Try to get main content area first
            main = soup.find("main") or soup.find("article") or soup.find("body")
            text_content = (
                main.get_text(separator="\n", strip=True)
                if main
                else soup.get_text(separator="\n", strip=True)
            )

            # Clean up excessive whitespace
            lines = [line.strip() for line in text_content.split("\n") if line.strip()]
            text_content = "\n".join(lines)[:5000]

            print(f"[RecipeAgent] Fetched URL successfully ({len(text_content)} chars)")
            return {"success": True, "content": text_content}

        except httpx.HTTPStatusError as e:
            print(f"[RecipeAgent] HTTP error {e.response.status_code} for URL: {url}")
            return {
                "success": False,
                "content": "",
                "error": f"HTTP {e.response.status_code}",
            }
        except httpx.TimeoutException:
            print(f"[RecipeAgent] Timeout fetching URL: {url}")
            return {"success": False, "content": "", "error": "Timeout"}
        except Exception as e:
            print(f"[RecipeAgent] URL fetch error: {type(e).__name__}: {e}")
            return {"success": False, "content": "", "error": str(e)}

    async def url_to_cart(
        self,
        url: str,
        prompt: str = None,
        budget_tier: BudgetTier = BudgetTier.STANDARD,
    ) -> list[CartItem]:
        """Extract products from URL, or use prompt + URL as context for AI."""
        print(f"[RecipeAgent] Processing URL: {url}")
        print(f"[RecipeAgent] User prompt: {prompt}")

        url_data = await self.fetch_url_content(url)

        # Even if URL fetch fails, if user gave a prompt we can still use the URL as context
        content = url_data.get("content", "")

        if not url_data["success"] and not prompt:
            print("[RecipeAgent] URL fetch failed and no prompt provided")
            return []

        # Build the AI prompt
        user_instruction = ""
        if prompt:
            user_instruction = f"\n\nIMPORTANT - User's specific instructions: {prompt}"

        if content:
            context_block = f"Webpage content from {url}:\n{content[:3500]}"
        else:
            context_block = f"URL provided: {url}\n(Could not fetch content, use the URL context and user instructions to recommend products)"

        ai_prompt = f"""You are a shopping assistant. Analyze the following and build a shopping cart of products to recommend.
{context_block}
{user_instruction}

Rules:
- All prices MUST be in Indian Rupees (INR)
- If the page is a recipe, extract ingredients as products
- If the page is a product review/comparison, extract the recommended products
- If user instructions filter or specify items, follow those instructions precisely
- Include 5-15 relevant products

IMPORTANT: Return ONLY a valid JSON array. No markdown. No explanations. No text before or after.
Format: [{{"name":"Product Name","quantity":"1","category":"essential","estimated_price":499,"substitutes":["Alternative 1"]}}]
Categories: essential, recommended, optional"""

        try:
            response = self.client.chat.completions.create(
                model=settings.nvidia_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a shopping assistant. Return ONLY a valid JSON array of products. No markdown code blocks. No explanations. Output starts with [ and ends with ]. Prices in Indian Rupees.",
                    },
                    {"role": "user", "content": ai_prompt},
                ],
                temperature=0.3,
                max_tokens=2000,
            )

            text = response.choices[0].message.content or ""
            items_data = safe_parse_json(text, "RecipeAgent", settings.nvidia_model)

            if not items_data or not isinstance(items_data, list):
                print("[RecipeAgent] AI returned no valid items")
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
                except (ValueError, KeyError) as e:
                    print(f"[RecipeAgent] Skipping item: {e}")
                    continue

            print(f"[RecipeAgent] Successfully built cart with {len(cart_items)} items")
            return cart_items

        except Exception as e:
            print(f"[RecipeAgent] AI API error: {type(e).__name__}: {e}")
            return []


recipe_agent = RecipeAgent()
