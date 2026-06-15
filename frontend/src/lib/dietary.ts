import { Product } from "./api";

// Allergen tag → keyword list (mirrors backend ALLERGEN_TAG_EXCLUSIONS)
export const ALLERGEN_EXCLUSIONS: Record<string, string[]> = {
  nuts: ["nut", "almond", "cashew", "peanut", "walnut", "pistachio"],
  gluten: [
    "wheat",
    "bread",
    "flour",
    "atta",
    "noodles",
    "pasta",
    "biscuit",
    "cookies",
  ],
  dairy: ["milk", "dairy", "butter", "cheese", "yogurt", "cream", "paneer"],
  soy: ["soy", "soya", "tofu"],
  shellfish: ["prawn", "shrimp", "crab", "lobster", "shellfish"],
  eggs: ["egg", "eggs"],
};

// Representative substance name shown on the red badge for each allergen.
// e.g. butter/cheese/paneer all map to the "dairy" allergen → displayed as "milk".
export const ALLERGEN_DISPLAY: Record<string, string> = {
  nuts: "nuts",
  gluten: "gluten",
  dairy: "milk",
  soy: "soy",
  shellfish: "shellfish",
  eggs: "egg",
};

/**
 * Returns the red-badge label (e.g. "Contains milk") for a product if it
 * contains any allergen the user has selected, otherwise null.
 *
 * Matching rules:
 *  - Uses the product NAME and structured INGREDIENTS list only — never the
 *    `category` or aggregated `tags` field, which are polluted by category
 *    names like "Dairy and Eggs" and cause false positives.
 *  - Word-boundary matching (optional trailing 's') to avoid substring hits
 *    such as "egg" inside "eggless".
 *  - Structured `allergen_tags` on the product are authoritative.
 */
export function getAllergenLabel(
  product: Product,
  userAllergenTags: string[] = [],
): string | null {
  const productAllergenTags = (
    (product as { allergen_tags?: string[] }).allergen_tags ?? []
  ).map((t) => t.toLowerCase());
  const ingredientsText = (
    (product as { ingredients?: string[] }).ingredients ?? []
  )
    .join(" ")
    .toLowerCase();
  const nameText = (product.name ?? "").toLowerCase();
  const searchable = `${nameText} ${ingredientsText}`;

  const matchKeyword = (kw: string): boolean => {
    if (productAllergenTags.some((t) => t === kw || t.startsWith(kw)))
      return true;
    const re = new RegExp(
      `\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`,
      "i",
    );
    return re.test(searchable);
  };

  const active = userAllergenTags
    .map((t) => t.toLowerCase())
    .filter((t) => ALLERGEN_EXCLUSIONS[t]);

  for (const allergen of active) {
    if (ALLERGEN_EXCLUSIONS[allergen].some(matchKeyword)) {
      return `Contains ${ALLERGEN_DISPLAY[allergen] ?? allergen}`;
    }
  }
  return null;
}
