# Implementation Plan: Amazon Polish Enhancements

## Overview

This implementation plan extends the existing Amazon Now MVP with a polished, personalized food shopping experience. Changes are additive — enhancing existing services, components, and APIs in-place. The plan covers: product data schema extension, expanded food catalog (200+ products), allergy safety filtering, alternative product recommendations, explainable recommendations, chat intent integration, dietary badge UI, recommendation feed UI enhancements, and integration testing.

## Tasks

- [x] 1. Extend Product Data Schema
  - [x] 1.1 Add structured fields to ProductCard model
    - Add `ingredients`, `dietary_tags`, `allergen_tags`, and `nutrition_summary` fields to `ProductCard` model in `backend/app/models/product.py`
    - Set default empty values (`[]` for lists, `None` for nutrition_summary) for backward compatibility
    - _Requirements: 8.1, 8.5, 8.6_
  - [x] 1.2 Extend the catalog format function
    - Update `_format()` function in `backend/app/services/catalog.py` to include the new structured fields in formatted output
    - Ensure `tags` field remains unchanged for backward compatibility
    - _Requirements: 8.2_
  - [x] 1.3 Extend frontend Product type
    - Add optional `ingredients`, `dietary_tags`, `allergen_tags`, `nutrition_summary`, `is_alternative`, and `replaces` fields to the `Product` type in `frontend/src/lib/api.ts`
    - All new fields must be optional so existing product responses remain valid
    - _Requirements: 8.4_
  - [x] 1.4 Extend frontend Recommendations type
    - Add optional `alternatives` array to the `Recommendations` type in `frontend/src/lib/api.ts`
    - _Requirements: 4.1_

- [x] 2. Create Enhanced Food Catalog (200+ Products)
  - [x] 2.1 Create enhanced food catalog JSON data file
    - Create `backend/data/food_catalog_enhanced.json` with 200+ structured food products
    - Cover categories: Fruits (20+), Vegetables (20+), Dairy (20+), Plant-based (15+), Breakfast (15+), Beverages (20+), Snacks (20+), High-protein (15+), Allergy-friendly (15+), Ready-to-eat (15+)
    - Each product must include `ingredients`, `dietary_tags`, `allergen_tags`, and optionally `nutrition_summary`
    - Ensure allergen consistency: if ingredients contain a known allergen, `allergen_tags` must include it
    - Ensure dietary consistency: restrictive tags must not contradict ingredients
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  - [x] 2.2 Create food catalog loader module
    - Create `backend/app/db/food_catalog.py` that loads the enhanced JSON and exports `FOOD_ENHANCED_PRODUCTS` list
    - _Requirements: 1.1_
  - [x] 2.3 Integrate enhanced catalog into catalog service
    - Import `FOOD_ENHANCED_PRODUCTS` into `backend/app/services/catalog.py`
    - Merge into `ALL_PRODUCTS` alongside existing AMAZON_PRODUCTS and PRODUCTS
    - _Requirements: 1.1, 8.2_

- [x] 3. Enhance Allergy Safety Filtering
  - [x] 3.1 Implement dual-mode filtering in profile service
    - Extend `filter_products()` in `backend/app/services/profile_service.py` to check structured `allergen_tags` list and `ingredients` list in addition to legacy `tags` string
    - Use case-insensitive substring matching across all three modes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.3_
  - [x] 3.2 Add conflict detection function
    - Add a `get_product_conflicts()` function that returns which specific keywords triggered a filter for a given product and exclusion set
    - _Requirements: 3.1_
  - [x] 3.3 Verify filtering across all surfaces
    - Ensure filtering applies to: recommendations endpoint, products search endpoint, and intent_engine chat results
    - Handle graceful degradation when profile is unreachable (return unfiltered results)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_
  - [ ]* 3.4 Write property test for Universal Filtering Invariant
    - **Property 1: Universal Filtering Invariant**
    - Generate random exclusion sets and product lists, verify no unsafe product passes filter on any surface
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [x] 4. Implement Alternative Product Recommendations
  - [x] 4.1 Create alternatives mapping and data structure
    - Create an alternatives mapping data structure in `backend/app/services/recommendation.py` mapping common allergen-containing products to safe alternatives by category
    - _Requirements: 4.3_
  - [x] 4.2 Implement find_alternatives function
    - Implement `find_alternatives()` function that identifies safe alternatives for filtered products
    - Selection criteria: same category, in-stock, passes exclusion filter, overlapping non-excluded tags
    - Return up to 1 alternative per filtered product; omit if none found
    - _Requirements: 4.1, 4.4, 4.5_
  - [x] 4.3 Integrate alternatives into recommendations response
    - Add alternatives into `get_recommendations()` return value as a new `alternatives` lane
    - _Requirements: 4.1_
  - [x] 4.4 Add alternatives API endpoint
    - Add a GET `/api/v1/products/{product_id}/alternatives` endpoint for on-demand alternative lookup
    - Accept `user_id` query parameter for exclusion set
    - _Requirements: 4.1, 4.5_
  - [ ]* 4.5 Write property test for Alternative Product Safety
    - **Property 3: Alternative Product Safety**
    - Generate filtered products and safe catalog, verify alternatives are same-category, in-stock, and pass filter
    - **Validates: Requirements 4.1, 4.3, 4.5**

- [x] 5. Checkpoint - Core backend logic verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Explainable Recommendations
  - [x] 6.1 Create reason computation function
    - Create `_compute_reason()` function in `recommendation.py` that generates contextual explanations
    - Priority order: intent > dietary match > allergen safety > nutritional > generic fallback
    - Generic fallback must return "Recommended for you" (never empty or null)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  - [x] 6.2 Integrate reasons into recommendation responses
    - Integrate `_compute_reason()` into `get_recommendations()` so every product in now_suggestions and trending has a personalized reason when user_id is present
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  - [x] 6.3 Ensure intent context in reasons
    - Ensure intent-based recommendations include chat context in the reason (e.g., "Recommended based on your chat about fever recovery")
    - _Requirements: 5.3_
  - [ ]* 6.4 Write property test for Reason Specificity
    - **Property 4: Reason Specificity**
    - Generate products with various recommendation contexts, verify reason references correct context
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.7**
  - [ ]* 6.5 Write property test for Reason Length Constraint
    - **Property 5: Reason Length Constraint**
    - Generate random reason strings of varying length, verify truncation at 120 chars
    - **Validates: Requirements 5.6**

- [ ] 7. Enhance Chat Intent Integration
  - [x] 7.1 Expand keyword intent map
    - Expand `_KEYWORD_INTENT_MAP` in `intent_engine.py` with food-specific intents: fever→soups/hydration/fruits, protein→tofu/paneer/lentils, vegetarian→plant-based foods, energy→nuts/bananas/energy-bars, coffee→coffee/caffeine/breakfast
    - _Requirements: 6.1, 6.4, 6.5, 6.6_
  - [x] 7.2 Increase recommendation diversity for intent queries
    - Increase recommendation fetch limit from 8 to 16 when intent query is active in `recommendation.py`
    - Implement category filter removal as fallback when no products match intent + category
    - _Requirements: 6.3, 6.8_
  - [x] 7.3 Ensure intent diversity across different queries
    - Ensure different intents produce at least 60% different product IDs by leveraging expanded catalog
    - _Requirements: 6.7_
  - [ ]* 7.4 Write property test for Intent Diversity
    - **Property 7: Intent Diversity**
    - Generate pairs of unrelated intents, verify >= 60% product difference
    - **Validates: Requirements 6.7**
  - [ ]* 7.5 Write property test for Intent Relevance
    - **Property 11: Intent Relevance**
    - Generate intents and catalog products, verify 60% term match in results
    - **Validates: Requirements 6.3**

- [x] 8. Enhance Product Card UI with Dietary Badges
  - [x] 8.1 Add dietary badge rendering
    - Add dietary badge rendering to `ProductCard` grid variant showing matching dietary_tags as green chips (✓ Vegetarian, ✓ Vegan, etc.)
    - Limit to maximum 3 badges per card
    - _Requirements: 2.1, 2.2_
  - [x] 8.2 Add allergen safety badge
    - Add allergen safety badge (blue) when product passes user's allergen filter
    - _Requirements: 2.3_
  - [x] 8.3 Add reason field display
    - Display the `reason` field as italic grey text below product name
    - Truncate with ellipsis at 120 characters
    - _Requirements: 5.6_
  - [x] 8.4 Add alternative product badge
    - Add "Recommended Alternative" orange badge for products with `is_alternative: true`
    - Display text reference naming the original filtered product
    - _Requirements: 4.2_
  - [x] 8.5 Add expandable ingredients section
    - Add expandable ingredients detail section to ProductCard (click to expand list)
    - Display within 200ms of interaction
    - _Requirements: 7.3_
  - [x] 8.6 Add discount display styling
    - Display original price with strikethrough, discounted price as primary, percentage-off badge
    - _Requirements: 7.4_
  - [ ]* 8.7 Write property test for Badge Correctness
    - **Property 6: Badge Correctness**
    - Generate random product-profile pairs, verify correct badge inclusion/exclusion and max 3 limit
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**

- [ ] 9. Enhance Recommendation Feed UI
  - [x] 9.1 Add alternatives carousel section
    - Add an "Alternatives" section in RecommendationFeed that displays alternative products in a horizontal scrollable carousel
    - _Requirements: 4.2, 7.5_
  - [x] 9.2 Enhance section headers with context
    - Enhance section headers to include recommendation lane context (e.g., "Based on your chat" when intent is active)
    - Limit header text to 60 characters
    - _Requirements: 7.2_
  - [x] 9.3 Pass profile data to ProductCard components
    - Pass user dietary profile data through to ProductCard components for badge rendering
    - Handle graceful degradation when profile is unavailable (show informational labels)
    - _Requirements: 2.1, 2.5, 2.6_
  - [x] 9.4 Add filtered count indicator
    - Display count of removed products with text indicator stating items were filtered due to dietary profile
    - _Requirements: 3.6_
  - [x] 9.5 Add visual distinction for personalized feeds
    - Add subtle profile indicator when filters are active to distinguish personalized vs generic feeds
    - _Requirements: 7.1_
  - [ ]* 9.6 Write property test for Section Header Length
    - **Property 12: Section Header Length**
    - Generate random header strings, verify <= 60 char enforcement
    - **Validates: Requirements 7.2**

- [x] 10. Checkpoint - Full UI integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Integration Testing & Runtime Verification
  - [x] 11.1 Verify dietary profile filtering
    - Test that dietary profile changes produce different recommendation sets (set vegetarian → confirm meat products filtered)
    - _Requirements: 3.1, 3.2_
  - [x] 11.2 Verify allergy filtering across all surfaces
    - Test that allergy filtering removes unsafe products from all surfaces (set nut allergy → confirm no nut products anywhere)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 11.3 Verify ingredients display on product cards
    - Test that ingredients are displayed on product cards in the frontend
    - _Requirements: 7.3, 8.4_
  - [x] 11.4 Verify alternative suggestions
    - Test that alternatives are suggested when products are filtered
    - _Requirements: 4.1, 4.2_
  - [x] 11.5 Verify chat intent differentiation
    - Test that different chat intents ("fever" vs "coffee") produce visibly different product feeds
    - _Requirements: 6.4, 6.5, 6.7_
  - [x] 11.6 Verify catalog size and structure
    - Test that the product pool has 200+ food products with structured metadata
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 11.7 Write property test for Product Data Consistency
    - **Property 2: Product Data Consistency**
    - Generate random products with ingredients/tags, verify allergen and dietary tag consistency
    - **Validates: Requirements 1.6, 1.7**
  - [ ]* 11.8 Write property test for Schema Field Validation
    - **Property 8: Schema Field Validation**
    - Generate random product data, verify field type and constraint compliance
    - **Validates: Requirements 1.2, 1.3, 1.4, 8.1, 8.5, 8.6**
  - [ ]* 11.9 Write property test for Backward Compatibility
    - **Property 9: Backward Compatibility**
    - Generate products with/without new fields, verify tags-based operations unchanged
    - **Validates: Requirements 8.2, 8.3**

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All changes are additive — existing APIs and components remain backward compatible
- The enhanced food catalog (Task 2) is a prerequisite for most other tasks
- Frontend tasks (8, 9) depend on backend schema and service tasks (1-7) being complete
- Python (backend) and TypeScript (frontend) are the implementation languages matching the existing codebase

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["3.1", "3.2", "7.1"] },
    { "id": 4, "tasks": ["3.3", "3.4", "4.1", "7.2", "7.3"] },
    { "id": 5, "tasks": ["4.2", "6.1", "7.4", "7.5"] },
    { "id": 6, "tasks": ["4.3", "4.4", "4.5", "6.2", "6.3"] },
    { "id": 7, "tasks": ["6.4", "6.5"] },
    { "id": 8, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 9, "tasks": ["8.7", "9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 10, "tasks": ["9.6"] },
    { "id": 11, "tasks": ["11.1", "11.2", "11.3", "11.4", "11.5", "11.6"] },
    { "id": 12, "tasks": ["11.7", "11.8", "11.9"] }
  ]
}
```
