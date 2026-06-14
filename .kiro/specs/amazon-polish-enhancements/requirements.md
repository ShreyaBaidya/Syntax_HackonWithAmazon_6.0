# Requirements Document

## Introduction

This specification defines enhancements to the existing Amazon Now personalized food shopping MVP. The goal is to elevate the application from a hackathon prototype to a polished, Amazon-style personalized food shopping experience. All enhancements MUST extend the existing codebase — no rebuilds, no architecture replacements, no removal of working features. The focus areas are: expanded product catalog with structured ingredient metadata, dietary-aware product cards with explainable recommendations, comprehensive allergy safety filtering, alternative product suggestions, and chat-intent-driven personalization.

## Glossary

- **Catalog_Service**: The backend service (`catalog.py`) responsible for product search, filtering, and retrieval from the in-memory product store
- **Recommendation_Engine**: The backend service (`recommendation.py`) that generates personalized product suggestions based on time context, user profile, and chat intent
- **Intent_Engine**: The backend service (`intent_engine.py`) that processes NowSpeak chat messages to extract shopping intent and influence recommendations
- **Profile_Service**: The backend service (`profile_service.py`) that manages dietary profiles, allergen preferences, custom exclusions, and computes exclusion keyword sets
- **Product_Card**: The frontend component that displays a single product with its metadata, pricing, and dietary compatibility information
- **Recommendation_Feed**: The frontend component that renders categorized product grids filtered by user profile
- **Exclusion_Set**: The computed set of keywords derived from a user's dietary tags, allergen tags, and custom exclusions, used to filter unsafe products
- **Ingredient_Metadata**: Structured data fields on a product including ingredients list, dietary tags, and allergen tags (not plain text descriptions)
- **Dietary_Match_Reason**: A textual explanation displayed on a product card indicating why the product is appropriate for the user's dietary profile
- **Alternative_Product**: A product suggested as a safe replacement when another product is filtered due to dietary or allergy restrictions
- **Chat_Intent**: The parsed shopping intent extracted from a NowSpeak chat message, consisting of a query string and optional category

## Requirements

### Requirement 1: Expanded Product Catalog with Structured Ingredient Metadata

**User Story:** As a health-conscious shopper, I want every food product to contain structured ingredient and dietary metadata, so that I can make informed decisions and the system can filter products programmatically.

#### Acceptance Criteria

1. THE Catalog_Service SHALL provide a minimum of 200 unique food products across the following categories: Fruits, Vegetables, Dairy, Plant-based foods, Breakfast items, Beverages, Snacks, High-protein foods, Allergy-friendly foods, Ready-to-eat foods
2. WHEN a product is retrieved from the Catalog_Service, THE product record SHALL contain an `ingredients` field as a list of strings representing individual ingredients, with a minimum of 1 ingredient and a maximum of 50 ingredients per product
3. WHEN a product is retrieved from the Catalog_Service, THE product record SHALL contain a `dietary_tags` field as a list of zero or more strings from the set: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, High-Protein, Low-Sugar, Organic
4. WHEN a product is retrieved from the Catalog_Service, THE product record SHALL contain an `allergen_tags` field as a list of zero or more strings from the set: Nuts, Dairy, Gluten, Soy, Shellfish, Eggs, where an empty list indicates the product contains none of the listed allergens
5. THE Catalog_Service SHALL maintain a minimum of 15 products per major category (Fruits, Vegetables, Dairy, Beverages, Snacks) and a minimum of 10 products per remaining category (Plant-based foods, Breakfast items, High-protein foods, Allergy-friendly foods, Ready-to-eat foods)
6. IF a product's `ingredients` field contains an item associated with a known allergen in the allergen set, THEN THE Catalog_Service SHALL include the corresponding allergen in that product's `allergen_tags` field
7. IF a product's `dietary_tags` includes a restrictive tag (Vegan, Gluten-Free, Dairy-Free, or Nut-Free), THEN THE product's `ingredients` field SHALL NOT contain any ingredient that contradicts that tag (e.g., a Dairy-Free product shall not list milk, cheese, or butter as an ingredient)

### Requirement 2: Dietary Profile Awareness on Product Cards

**User Story:** As a user with dietary preferences, I want to see why each product is appropriate for my profile directly on the product card, so that I can shop with confidence.

#### Acceptance Criteria

1. WHILE a user has a saved dietary profile, THE Product_Card SHALL display up to 3 Dietary_Match_Reason badges indicating compatibility with the user's diet tags, allergen tags, and custom exclusions
2. WHEN a product's tags field contains none of the exclusion keywords mapped from a user's diet preference tag (as defined in DIET_TAG_EXCLUSIONS), THE Product_Card SHALL display a green badge with the matching diet label (e.g., "✓ Vegetarian Friendly", "✓ Gluten Free")
3. WHEN a product's tags field contains none of the exclusion keywords mapped from the user's allergen tags (as defined in ALLERGEN_TAG_EXCLUSIONS), THE Product_Card SHALL display a safety badge (e.g., "✓ Safe For Your Allergy Settings")
4. WHEN a product's tags field contains none of the user's custom exclusion keywords (comma-separated, case-insensitive substring match), THE Product_Card SHALL display "✓ Fits Your Custom Exclusions"
5. WHILE a user has no saved dietary profile, THE Product_Card SHALL display the product's tags metadata as informational labels without personalized match indicators
6. IF the user's dietary profile cannot be retrieved within 2 seconds, THEN THE Product_Card SHALL render without personalized badges and display the product's tags metadata as informational labels (graceful degradation)
7. IF a product's tags field contains one or more exclusion keywords from the user's profile, THEN THE Product_Card SHALL omit the corresponding badge category for that conflict and display only badges for categories where no conflict exists

### Requirement 3: Comprehensive Allergy Safety Filtering

**User Story:** As a user with food allergies, I want all unsafe products to be completely filtered from every product surface, so that I never encounter a dangerous product.

#### Acceptance Criteria

1. WHILE a user has a stored Profile_Object with a non-empty Exclusion_Set, THE Recommendation_Engine SHALL exclude all products whose tags field contains any keyword from the user's Exclusion_Set using case-insensitive substring matching
2. WHILE a user has a stored Profile_Object with a non-empty Exclusion_Set, THE Catalog_Service SHALL exclude all products whose tags field contains any keyword from the user's Exclusion_Set from category browsing results using case-insensitive substring matching
3. WHILE a user has a stored Profile_Object with a non-empty Exclusion_Set, THE Catalog_Service SHALL exclude all products whose tags field contains any keyword from the user's Exclusion_Set from search results using case-insensitive substring matching
4. WHILE a user has a stored Profile_Object with a non-empty Exclusion_Set, THE Intent_Engine SHALL exclude all products whose tags field contains any keyword from the user's Exclusion_Set from NowSpeak chat recommendations using case-insensitive substring matching
5. WHEN all products in a recommendation lane are removed after applying the Exclusion_Set filter, THE Recommendation_Engine SHALL backfill the lane with products that pass the Filter_Function sourced from the broader catalog up to the original lane size
6. WHEN one or more products have been removed from a recommendation feed by the Filter_Function, THE Recommendation_Feed SHALL display the count of removed products alongside a text indicator stating that items were filtered due to the user's dietary profile
7. IF the Profile_Store is unreachable or the user_id is not provided in an API request, THEN THE system SHALL return unfiltered results rather than blocking the response

### Requirement 4: Alternative Product Recommendations

**User Story:** As a user with allergies or dietary restrictions, I want to see safe alternatives when a product I might want is unsafe for me, so that I can still find what I need.

#### Acceptance Criteria

1. WHEN a product is filtered due to a dietary restriction or allergy conflict, THE Recommendation_Engine SHALL identify and suggest up to 1 alternative product from the same product category that passes the user's safety filter
2. WHEN an alternative product is suggested, THE Product_Card SHALL display a "Recommended Alternative" label and a text reference naming the original filtered product it replaces (e.g., "Try this instead of Peanut Butter")
3. THE Recommendation_Engine SHALL select alternatives from the same product category as the filtered product, prioritizing products that serve a similar dietary function (e.g., Sunflower Seed Butter for Peanut Butter, Oat Milk for Dairy Milk, Coconut Yogurt for Greek Yogurt) based on matching category and overlapping non-excluded tags
4. IF no safe alternative exists within the same product category for a filtered product, THEN THE Recommendation_Engine SHALL omit the alternative suggestion entirely for that product without displaying a placeholder or suggesting a product from a different category
5. WHEN alternatives are generated, THE Recommendation_Engine SHALL only suggest products that are currently in stock and that do not contain any keyword from the user's exclusion set in their tags

### Requirement 5: Explainable Recommendations

**User Story:** As a user, I want every recommended product to explain why it appears in my feed, so that I understand the personalization and trust the system.

#### Acceptance Criteria

1. WHEN a product is recommended based on the user's dietary preference, THE Recommendation_Engine SHALL attach a non-empty reason field that references the specific dietary tag from the user's profile (e.g., "Recommended because it matches your vegetarian preference")
2. WHEN a product is recommended because it passes allergy safety, THE Recommendation_Engine SHALL attach a non-empty reason field that references the specific allergen the product is free from (e.g., "Recommended because it is nut-free")
3. WHEN a product is recommended based on a NowSpeak chat intent, THE Recommendation_Engine SHALL attach a non-empty reason field that includes the original query text from the chat context (e.g., "Recommended based on your recent chat about fever recovery")
4. WHEN a product is recommended based on nutritional properties, THE Recommendation_Engine SHALL attach a non-empty reason field that names the specific nutritional attribute (e.g., "Recommended because it is high protein")
5. WHEN a product is recommended based on time-of-day context or trending popularity, THE Recommendation_Engine SHALL attach a non-empty reason field indicating the recommendation basis (e.g., time-of-day greeting or trending status)
6. THE Product_Card SHALL display the reason field as visible text below the product name with a maximum length of 120 characters, truncated with an ellipsis if exceeded
7. IF the Recommendation_Engine cannot determine a reason category for a product, THEN THE Recommendation_Engine SHALL assign a generic reason field value of "Recommended for you" rather than leaving the field empty or null

### Requirement 6: Chat Intent Integration for Dynamic Recommendations

**User Story:** As a user, I want my NowSpeak chat conversations to dynamically change my homepage product feed, so that the app responds to my immediate needs.

#### Acceptance Criteria

1. WHEN a user sends a message (1 to 500 characters) through NowSpeak, THE Intent_Engine SHALL extract a shopping intent containing a query (1 to 200 characters) and an optional category within 3 seconds of message submission
2. IF the Intent_Engine fails to extract a structured intent from the user message, THEN THE Intent_Engine SHALL fall back to keyword-based intent extraction using the original message text as the query
3. WHEN the Intent_Engine produces a new intent, THE Recommendation_Engine SHALL return between 1 and 8 products matching that intent in the now_suggestions lane, where at least 60% of returned products contain terms from the intent query in their name, tags, or category
4. WHEN a user says "I have a fever", THE Recommendation_Engine SHALL return products from categories including soups, hydration drinks, fruits, and light recovery foods, with at least 3 products in the now_suggestions lane
5. WHEN a user says "I need coffee", THE Recommendation_Engine SHALL return products from categories including coffee products, caffeine beverages, and breakfast snacks, with at least 3 products in the now_suggestions lane
6. WHEN a user says "I want high protein vegetarian food", THE Recommendation_Engine SHALL return products from categories including tofu, paneer, lentils, chickpeas, and protein-rich vegetarian foods, with at least 3 products in the now_suggestions lane
7. WHEN two unrelated chat intents are processed (intents with no overlapping query terms), THE Recommendation_Engine SHALL produce product feeds with a minimum 60% difference in product IDs between the two results
8. IF no products match the extracted intent query and category, THEN THE Recommendation_Engine SHALL broaden the search by removing the category filter and return up to 8 general products in the now_suggestions lane

### Requirement 7: Amazon-Style UI Enhancement

**User Story:** As a user, I want the application to look and feel like a polished Amazon-style quick commerce experience, so that it feels professional and trustworthy.

#### Acceptance Criteria

1. THE Product_Card SHALL display the product image, name, price, unit, applicable dietary badges (derived from the product's category or tags), and an add-to-cart button arranged in a grid cell with a maximum product name length of 2 lines (truncated with ellipsis if exceeded)
2. THE Recommendation_Feed SHALL organize products into visually distinct sections, each preceded by a section header of no more than 60 characters that describes the recommendation context (e.g., time-of-day greeting, category name, or reorder prompt)
3. WHEN the user taps or hovers on a product's ingredient area, THE Product_Card SHALL display an expandable detail view or tooltip showing structured ingredient information within 200 milliseconds of the interaction
4. WHEN a product has a discount, THE Product_Card SHALL display the original price with a strikethrough style, the discounted price as the primary displayed price, and a percentage-off badge showing the integer discount percentage (rounded to nearest whole number)
5. THE Recommendation_Feed SHALL support horizontal scrolling for recommendation carousels on the homepage, allowing swipe or drag gestures to scroll with a minimum scrollable distance of one full product card width per gesture, and scrolling SHALL complete its animation within 300 milliseconds
6. IF the product image fails to load, THEN THE Product_Card SHALL display a category-specific placeholder graphic in place of the broken image, maintaining the same dimensions as a loaded product image
7. THE Product_Card grid layout SHALL render a minimum of 2 columns on viewports 320px wide and a minimum of 4 columns on viewports 768px wide or larger, with consistent spacing between cards of 8px

### Requirement 8: Product Data Schema Extension

**User Story:** As a developer, I want the product data model to support structured metadata fields, so that the filtering, matching, and display logic can operate on structured data rather than plain text.

#### Acceptance Criteria

1. THE Catalog_Service SHALL extend the product schema to include: `ingredients` (list of strings, maximum 50 items, each up to 100 characters), `dietary_tags` (list of strings, maximum 20 items), `allergen_tags` (list of strings, maximum 20 items), and `nutrition_summary` (optional dictionary with numeric values for keys: calories in kcal, protein in grams, carbs in grams, fat in grams)
2. THE Catalog_Service SHALL maintain backward compatibility with the existing `tags` field such that all existing API responses continue to include the `tags` field unchanged and text-based search queries using `tags` continue to produce identical results
3. WHEN the `allergen_tags` field is populated on a product, THE Profile_Service SHALL exclude that product if any of the user's allergen exclusion keywords match an entry in the product's structured `allergen_tags` list OR match within the product's text-based `tags` field
4. THE frontend Product type SHALL be extended to include `ingredients`, `dietary_tags`, `allergen_tags`, and `nutrition_summary` as optional fields so that existing product responses without these fields remain valid
5. IF the new structured fields (`ingredients`, `dietary_tags`, `allergen_tags`, `nutrition_summary`) are absent or null for a product, THEN THE Catalog_Service SHALL default them to empty list for list fields and null for `nutrition_summary`, and filtering logic SHALL treat empty lists as having no matching entries
6. IF the `nutrition_summary` dictionary is present but contains only a subset of keys (calories, protein, carbs, fat), THEN THE Catalog_Service SHALL accept the partial dictionary and treat missing keys as null

## Scope Classification

### MVP Scope (Must-have)

- **Requirement 1**: Expanded Product Catalog (200+ products with structured metadata)
- **Requirement 2**: Dietary Profile Awareness on Product Cards
- **Requirement 3**: Comprehensive Allergy Safety Filtering
- **Requirement 5**: Explainable Recommendations
- **Requirement 6**: Chat Intent Integration
- **Requirement 7**: Amazon-Style UI Enhancement
- **Requirement 8**: Product Data Schema Extension

### Stretch Goals

- **Requirement 4**: Alternative Product Recommendations
