# Requirements Document

## Introduction

The Dietary & Allergy Profile feature introduces a global personalization layer for the Amazon Now hackathon MVP. Users can declare dietary preferences (e.g., vegan, keto) and allergen sensitivities (e.g., nuts, gluten, lactose) once, and the system transparently filters, warns, or re-ranks content across four surfaces: Recommendations, NowSpeak AI chat, Product Search, and Shared Cart. The feature is designed as a lightweight overlay that reuses existing recommendation logic, NowSpeak intent engine, and catalog search with minimal backend changes — no new database tables and no authentication system required.

## Glossary

- **Profile_Store**: In-memory (server-side) dictionary keyed by user_id that persists dietary and allergen preferences for the session lifetime. Mirrors the existing Shared Cart in-memory architecture.
- **Diet_Tag**: A named dietary pattern the user selects (e.g., "vegan", "vegetarian", "keto", "halal"). Each Diet_Tag maps to a set of excluded product tags and categories.
- **Allergen_Tag**: A specific allergen sensitivity declared by the user (e.g., "nuts", "gluten", "dairy", "shellfish", "soy"). Each Allergen_Tag maps to a set of product tag keywords that indicate the allergen is present.
- **Profile_Object**: A JSON structure containing a list of Diet_Tags, a list of Allergen_Tags, and a free-text custom exclusion string.
- **Exclusion_Set**: The computed union of all product tag keywords that should trigger filtering or warnings, derived from the active Diet_Tags, Allergen_Tags, and custom exclusions in a Profile_Object.
- **Recommendation_Engine**: The existing service (`recommendation.py`) that produces time-based suggestions, reorder nudges, and trending products.
- **Intent_Engine**: The existing NowSpeak service (`intent_engine.py`) that extracts shopping intent and streams AI-generated replies with product cards.
- **Catalog_Service**: The existing service (`catalog.py`) that performs full-text product search across the 3,781-item catalog.
- **Shared_Cart_Service**: The existing in-memory service (`cart_service.py`) that manages real-time collaborative shopping carts with SSE broadcast.
- **Filter_Function**: A reusable utility that accepts a list of products and an Exclusion_Set, and returns products that do not match any excluded keywords.
- **Warning_Badge**: A visual UI indicator shown on a product card when the product partially matches an allergen but is not fully excluded (e.g., "may contain" scenarios).
- **Profile_Banner**: A persistent UI strip on the home page showing the active dietary profile with a quick-edit affordance.

## Requirements

### Requirement 1: Profile Creation and Storage

**User Story:** As a shopper, I want to declare my dietary preferences and allergen sensitivities, so that the app personalizes my experience without asking me repeatedly.

#### Acceptance Criteria

1. WHEN a user submits a Profile_Object via the profile API endpoint, THE Profile_Store SHALL persist the Profile_Object keyed by user_id in memory.
2. WHEN a user submits a Profile_Object without providing a user_id, THE Profile_Store SHALL generate a random identifier and return it in the response.
3. WHEN a Profile_Object is stored, THE Profile_Store SHALL compute and cache the corresponding Exclusion_Set from the declared Diet_Tags, Allergen_Tags, and custom exclusions.
4. THE Profile_Store SHALL support retrieval of a stored Profile_Object given a valid user_id.
5. WHEN a user updates an existing Profile_Object, THE Profile_Store SHALL replace the previous profile and recompute the Exclusion_Set.
6. THE Profile_Store SHALL expose a predefined mapping from each Diet_Tag to its excluded product tag keywords.
7. THE Profile_Store SHALL expose a predefined mapping from each Allergen_Tag to its matching product tag keywords.

### Requirement 2: Recommendation Filtering

**User Story:** As a shopper with dietary restrictions, I want my home feed to only show products I can eat, so that I do not waste time scrolling past irrelevant items.

#### Acceptance Criteria

1. WHEN the Recommendation_Engine generates now_suggestions for a user with a stored Profile_Object, THE Recommendation_Engine SHALL apply the Filter_Function to remove products whose tags match any keyword in the Exclusion_Set.
2. WHEN the Recommendation_Engine generates trending products for a user with a stored Profile_Object, THE Recommendation_Engine SHALL apply the Filter_Function to remove products whose tags match any keyword in the Exclusion_Set.
3. WHEN the Recommendation_Engine generates reorder_nudges for a user with a stored Profile_Object, THE Recommendation_Engine SHALL apply the Filter_Function to remove products whose tags match any keyword in the Exclusion_Set.
4. WHEN filtering removes all products from a recommendation lane, THE Recommendation_Engine SHALL backfill from the catalog with products that pass the Filter_Function up to the original lane size.
5. THE Filter_Function SHALL perform case-insensitive substring matching of each Exclusion_Set keyword against the product tags field.

### Requirement 3: NowSpeak AI Diet Awareness

**User Story:** As a shopper using voice/chat, I want NowSpeak to automatically account for my allergies when suggesting products, so that I receive safe recommendations without needing to repeat my restrictions.

#### Acceptance Criteria

1. WHEN the Intent_Engine processes a chat message for a user with a stored Profile_Object, THE Intent_Engine SHALL inject the user's Exclusion_Set into the catalog search as a post-filter.
2. WHEN the Intent_Engine streams a reply for a user with dietary restrictions, THE Intent_Engine SHALL include a brief acknowledgment of the dietary filter in the AI system prompt context.
3. WHEN the Intent_Engine catalog search returns zero results after applying the Exclusion_Set filter, THE Intent_Engine SHALL retry the search without category restriction while still applying the Exclusion_Set filter.
4. THE Intent_Engine SHALL pass the user_id from the ChatRequest to the Profile_Store to retrieve the active Exclusion_Set.

### Requirement 4: Product Search Filtering

**User Story:** As a shopper with allergies, I want product search results to be filtered according to my profile, so that I only see items that are safe for me.

#### Acceptance Criteria

1. WHEN the Catalog_Service processes a search request that includes a user_id with a stored Profile_Object, THE Catalog_Service SHALL apply the Filter_Function to the results before returning them.
2. WHEN the Catalog_Service applies the Filter_Function and the remaining result count is below the requested limit, THE Catalog_Service SHALL return only the safe products without backfilling unsafe products.
3. THE Catalog_Service SHALL accept an optional user_id query parameter on the product search endpoint.

### Requirement 5: Shared Cart Allergen Warnings

**User Story:** As a participant in a shared cart, I want to see a warning when another person adds a product that conflicts with my dietary profile, so that I can avoid accidental allergen exposure.

#### Acceptance Criteria

1. WHEN a product is added to a Shared Cart and any participant in that cart has a stored Profile_Object, THE Shared_Cart_Service SHALL check the product tags against each participant's Exclusion_Set.
2. WHEN a product conflicts with a participant's Exclusion_Set, THE Shared_Cart_Service SHALL include a warnings array in the SSE broadcast event identifying which participant(s) have a conflict and which Allergen_Tags or Diet_Tags are triggered.
3. WHEN the frontend receives a cart_update event with a non-empty warnings array, THE frontend SHALL display a Warning_Badge on the conflicting product's cart row.
4. THE Warning_Badge SHALL display the name of the affected participant and the specific allergen or dietary conflict.

### Requirement 6: Profile Setup UI

**User Story:** As a new user, I want a quick onboarding screen where I can select my dietary preferences and allergies from predefined options, so that I can set up my profile in under 30 seconds.

#### Acceptance Criteria

1. THE Profile_Setup_Page SHALL display a grid of selectable Diet_Tag options (vegan, vegetarian, keto, halal, pescatarian, gluten-free).
2. THE Profile_Setup_Page SHALL display a grid of selectable Allergen_Tag options (nuts, gluten, dairy, soy, shellfish, eggs).
3. THE Profile_Setup_Page SHALL provide a free-text input field for custom exclusion keywords.
4. WHEN the user taps "Save Profile", THE Profile_Setup_Page SHALL submit the Profile_Object to the backend API and store the returned user_id in browser sessionStorage.
5. WHEN the user has an existing profile, THE Profile_Setup_Page SHALL pre-populate the selections from the stored Profile_Object.
6. THE Profile_Setup_Page SHALL be accessible from the home page header and the bottom navigation "Account" tab.

### Requirement 7: Profile Banner on Home Page

**User Story:** As a returning user, I want to see my active dietary profile summarized on the home page, so that I have confidence filtering is active and can quickly edit it.

#### Acceptance Criteria

1. WHEN a user has a stored Profile_Object, THE Home_Page SHALL display a Profile_Banner below the header showing the active Diet_Tags and Allergen_Tags as pill chips.
2. WHEN the user taps the Profile_Banner, THE Home_Page SHALL navigate to the Profile_Setup_Page for editing.
3. WHEN a user has no stored Profile_Object, THE Home_Page SHALL display a "Set up dietary profile" prompt in the Profile_Banner position.

### Requirement 8: Diet Tag to Exclusion Mapping

**User Story:** As a developer, I want a well-defined mapping from diet/allergen labels to product tag keywords, so that filtering logic is deterministic and testable.

#### Acceptance Criteria

1. THE Profile_Store SHALL map the "vegan" Diet_Tag to exclude products tagged with keywords: "milk", "dairy", "egg", "meat", "chicken", "fish", "butter", "cheese", "yogurt", "honey".
2. THE Profile_Store SHALL map the "vegetarian" Diet_Tag to exclude products tagged with keywords: "meat", "chicken", "fish", "mutton", "pork", "prawn", "shrimp".
3. THE Profile_Store SHALL map the "keto" Diet_Tag to exclude products tagged with keywords: "sugar", "bread", "rice", "wheat", "flour", "atta", "noodles", "pasta".
4. THE Profile_Store SHALL map the "nuts" Allergen_Tag to exclude products tagged with keywords: "nut", "almond", "cashew", "peanut", "walnut", "pistachio".
5. THE Profile_Store SHALL map the "gluten" Allergen_Tag to exclude products tagged with keywords: "wheat", "bread", "flour", "atta", "noodles", "pasta", "biscuit", "cookies".
6. THE Profile_Store SHALL map the "dairy" Allergen_Tag to exclude products tagged with keywords: "milk", "dairy", "butter", "cheese", "yogurt", "cream", "paneer".
7. FOR ALL valid Profile_Objects, computing the Exclusion_Set then filtering then recomputing SHALL produce the same Exclusion_Set (idempotence).
8. WHEN inferring a product's dietary_tags from its name (for products lacking structured dietary metadata), THE Catalog_Service SHALL treat eggs as NON-vegetarian (Indian dietary convention) — a product whose name contains "egg", "eggs", or "quail" SHALL NOT receive the "Vegetarian" tag.
9. THE Catalog_Service dietary_tag inference SHALL match keywords against the product NAME using word boundaries only, NOT against the aggregated tags field, since category names such as "Dairy and Eggs" pollute the tags of unrelated products (e.g. milk, butter).

### Requirement 9: Safe Alternative Suggestions

**User Story:** As a shopper with dietary restrictions, I want the system to suggest a safe alternative when a product I might want is filtered out, so that I still discover relevant items instead of seeing empty results.

#### Acceptance Criteria

1. WHEN the Filter_Function removes a product from any recommendation lane or search result, THE system SHALL attempt to find a safe alternative product in the same category that passes the Exclusion_Set.
2. THE Alternative_Suggestion SHALL be identified by matching the original product's category and selecting the highest-relevance product that passes the Filter_Function.
3. WHEN a safe alternative is found, THE system SHALL include an `alternative` field on the filtered product's response entry containing the alternative product card and a reason string (e.g., "Almond Butter — safe alternative to Peanut Butter").
4. WHEN no safe alternative exists in the same category, THE system SHALL omit the `alternative` field rather than suggesting a product from an unrelated category.
5. THE Alternative_Suggestion logic SHALL reuse the existing Catalog_Service search with the Exclusion_Set applied, querying for the same category as the removed product.

### Requirement 10: Dietary Labels on Product Cards

**User Story:** As a shopper, I want product cards to clearly show how each item relates to MY selected dietary preferences and allergens, so that I can make safe choices at a glance without irrelevant clutter.

#### Acceptance Criteria

1. WHEN a user has NOT configured a Profile_Object, THE product cards SHALL NOT display any dietary or allergen labels.
2. WHEN a user has configured Diet_Tags, THE product card SHALL display a green badge for each of the product's dietary_tags that matches one of the user's selected Diet_Tags (e.g. "✓ Vegetarian"), AND SHALL NOT display dietary_tags the user did not select.
3. WHEN a user has configured Allergen_Tags AND a product contains an allergen the user selected, THE product card SHALL display a single red badge naming the representative substance of that allergen (e.g. any dairy-derived product such as butter, cheese, paneer, cream, or yogurt SHALL display "Contains milk").
4. THE system SHALL NOT display generic dietary-conflict labels such as "Non-Vegetarian" or "Non-Vegan"; labels are derived solely from the user's selected preferences and allergens.
5. THE system SHALL NOT display an "Allergen Safe" badge, nor informational "Contains X" badges for allergens the user has not selected.
6. THE allergen substance match SHALL use word-boundary matching against the product name and structured ingredient list only, AND SHALL NOT match against the product's category or aggregated tags field (which are polluted by category names such as "Dairy and Eggs" and would otherwise cause false positives like flagging lactose-free milk for an egg allergen).
7. WHEN the NowSpeak AI acknowledges dietary restrictions in its streamed reply, THE reply SHALL name the specific restriction being honored (e.g., "Since you're avoiding gluten, here are some options…").
8. THE Profile_Banner on the home page MAY display a count of products filtered in the current recommendation feed (e.g., "3 items filtered for your safety"). [Stretch]

### Requirement 11: Global Personalization Layer Architecture

**User Story:** As a developer, I want the dietary profile to function as a single reusable service consumed by all product-surfacing systems, so that filtering behavior is consistent and centralized rather than duplicated per feature.

#### Acceptance Criteria

1. ALL product-surfacing systems (Recommendation_Engine, Intent_Engine, Catalog_Service, Shared_Cart_Service) SHALL consume filtering through a single shared Filter_Function utility rather than implementing their own filtering logic.
2. THE Filter_Function SHALL accept two inputs: a list of product dictionaries and an Exclusion_Set, and return a filtered list.
3. THE Filter_Function SHALL be importable as a standalone module (`app/services/profile_service.py`) without circular dependencies on any specific surface (recommendations, chat, catalog, cart).
4. WHEN a new product-surfacing system is added in the future (e.g., AI-generated carts), IT SHALL be able to integrate dietary filtering by importing and calling the same Filter_Function with no additional backend changes.
5. THE Profile_Store and Filter_Function SHALL be stateless with respect to which surface is calling them — the same user_id and Exclusion_Set SHALL produce identical filtering results regardless of whether called from recommendations, search, NowSpeak, or shared cart.
6. THE frontend SHALL retrieve the user's Profile_Object once on app load and pass the user_id to all API calls, rather than each component managing profile state independently.

## Scope Classification

### MVP Scope (Must-have for demo)

The following requirements constitute the minimum demonstrable feature set:

- **Requirement 1**: Profile Creation and Storage — backend in-memory store + API endpoint
- **Requirement 2**: Recommendation Filtering — home feed filters products based on profile
- **Requirement 3**: NowSpeak AI Diet Awareness — voice AI acknowledges and respects restrictions
- **Requirement 4**: Product Search Filtering — catalog search respects profile
- **Requirement 6**: Profile Setup UI — onboarding page with selectable tags
- **Requirement 7**: Profile Banner on Home Page — visual confirmation filtering is active
- **Requirement 8**: Diet Tag to Exclusion Mapping — deterministic keyword mappings
- **Requirement 11**: Global Personalization Layer Architecture — single shared Filter_Function

### Stretch Goals (High-impact if time permits)

The following requirements enhance the experience but are not required for a convincing demo:

- **Requirement 5**: Shared Cart Allergen Warnings — real-time warnings when others add conflicting items
- **Requirement 9**: Safe Alternative Suggestions — proactive replacement recommendations
- **Requirement 10**: Dietary Labels on Product Cards — badges on product cards driven by the user's selected preferences and allergens
