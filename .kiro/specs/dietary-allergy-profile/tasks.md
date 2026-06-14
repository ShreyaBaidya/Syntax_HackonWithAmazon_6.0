# Implementation Plan: Dietary & Allergy Profile

## Overview

This plan implements a global personalization layer that filters products across Recommendations, NowSpeak AI chat, Product Search, and Shared Cart based on user dietary preferences and allergen sensitivities. The implementation follows a backend-first approach: core profile service → API layer → integration with existing services → frontend UI.

## Tasks

- [ ] 1. Create core profile service and data models
  - [x] 1.1 Create Pydantic models for profile data
    - Create `backend/app/models/profile.py` with `ProfileObject`, `ProfileCreateRequest`, and `ProfileResponse` models
    - `ProfileObject` has fields: `diet_tags: List[str]`, `allergen_tags: List[str]`, `custom_exclusions: str`
    - `ProfileCreateRequest` has fields: `user_id: Optional[str]`, `profile: ProfileObject`
    - `ProfileResponse` has fields: `user_id: str`, `profile: ProfileObject`, `exclusion_set: List[str]`
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ] 1.2 Create profile service with in-memory store, tag mappings, and filter function
    - Create `backend/app/services/profile_service.py`
    - Implement `DIET_TAG_EXCLUSIONS` dict mapping each diet tag to its exclusion keywords (vegan, vegetarian, keto, halal, pescatarian, gluten-free)
    - Implement `ALLERGEN_TAG_EXCLUSIONS` dict mapping each allergen tag to its keywords (nuts, gluten, dairy, soy, shellfish, eggs)
    - Implement `_PROFILES` in-memory dict keyed by user_id
    - Implement `compute_exclusion_set(diet_tags, allergen_tags, custom_exclusions) → Set[str]` as the union of all mapped keywords
    - Implement `save_profile(user_id, diet_tags, allergen_tags, custom_exclusions) → dict` that generates user_id if None, computes exclusion_set, and stores in `_PROFILES`
    - Implement `get_profile(user_id) → Optional[dict]` for retrieval
    - Implement `get_exclusion_set(user_id) → Optional[Set[str]]` for quick access to cached exclusion set
    - Implement `filter_products(products: List[dict], exclusion_set: Optional[Set[str]]) → List[dict]` using case-insensitive substring matching against product `tags` field
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 11.1, 11.2, 11.3, 11.5_

  - [ ]* 1.3 Write property test for exclusion set computation correctness
    - **Property 2: Exclusion_Set computation correctness**
    - Use `hypothesis` library to generate random combinations of valid diet_tags and allergen_tags from the predefined sets, plus arbitrary custom exclusion strings
    - Assert: computed set equals the union of `DIET_TAG_EXCLUSIONS[tag]` for each diet_tag + `ALLERGEN_TAG_EXCLUSIONS[tag]` for each allergen_tag + custom tokens
    - Create test file `backend/tests/test_profile_properties.py`
    - **Validates: Requirements 1.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

  - [ ]* 1.4 Write property test for exclusion set idempotence
    - **Property 3: Exclusion_Set computation idempotence**
    - Use `hypothesis` to generate arbitrary ProfileObjects and assert `compute_exclusion_set` called twice with same inputs yields identical results
    - **Validates: Requirements 8.7**

  - [ ]* 1.5 Write property test for filter completeness
    - **Property 4: Filter completeness — no excluded product passes**
    - Use `hypothesis` to generate random product lists (with tags field) and random exclusion sets
    - Assert: every product in `filter_products` output has no keyword from exclusion_set as a substring in its tags (case-insensitive)
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 4.1, 11.2**

  - [ ]* 1.6 Write property test for filter preserving safe products
    - **Property 5: Filter preserves safe products**
    - Use `hypothesis` to generate random product lists and exclusion sets
    - Assert: every product whose tags do NOT contain any exclusion keyword appears in the filter output (no false positives)
    - **Validates: Requirements 2.5, 4.2**

  - [ ]* 1.7 Write property test for filter statelessness
    - **Property 6: Filter statelessness**
    - Call `filter_products` multiple times with the same inputs and assert identical output each time (pure function)
    - **Validates: Requirements 11.5**

- [ ] 2. Create profile API router and register it
  - [ ] 2.1 Create FastAPI profile router
    - Create `backend/app/api/profile.py` with endpoints:
      - `POST /profile` — create or update profile, returns `ProfileResponse`
      - `GET /profile/{user_id}` — retrieve stored profile, returns 404 if not found
      - `GET /profile/mappings/diet` — returns `DIET_TAG_EXCLUSIONS` dict
      - `GET /profile/mappings/allergens` — returns `ALLERGEN_TAG_EXCLUSIONS` dict
    - Import and use `save_profile`, `get_profile` from `profile_service`
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6, 1.7_

  - [ ] 2.2 Register profile router in main.py
    - Import `profile` from `app.api` in `backend/app/main.py`
    - Add `app.include_router(profile.router, prefix="/api/v1", tags=["Profile"])` alongside existing routers
    - _Requirements: 11.3_

  - [ ]* 2.3 Write property test for profile persistence round-trip
    - **Property 1: Profile persistence round-trip**
    - Use `hypothesis` to generate random valid ProfileObjects, save them, then retrieve by returned user_id
    - Assert: retrieved profile equals original profile
    - **Validates: Requirements 1.1, 1.4, 1.5**

  - [ ]* 2.4 Write property test for profile update overwrites
    - **Property 7: Profile update overwrites previous state**
    - Save two distinct profiles under the same user_id sequentially
    - Assert: retrieval returns the second profile, not the first
    - **Validates: Requirements 1.5**

- [ ] 3. Checkpoint - Verify core profile service
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Integrate dietary filtering into Recommendation Engine
  - [ ] 4.1 Add profile filtering to recommendation service
    - Modify `backend/app/services/recommendation.py`:
      - Import `get_exclusion_set`, `filter_products` from `profile_service`
      - In `get_recommendations(user_id)`, call `get_exclusion_set(user_id)` to get the exclusion set
      - Apply `filter_products` to `now_suggestions`, `trending`, and `reorder_nudges` after generating each lane
      - Implement backfill logic: if a lane is empty after filtering and exclusion_set is not None, search catalog broadly and filter results to fill the lane
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1_

  - [ ]* 4.2 Write unit tests for recommendation filtering
    - Test that recommendations with a profile set exclude products matching exclusion keywords
    - Test backfill logic when a lane becomes empty after filtering
    - Test that recommendations without a profile return unfiltered results (graceful degradation)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Integrate dietary filtering into Product Search
  - [ ] 5.1 Add user_id parameter to product search endpoint and catalog service
    - Modify `backend/app/api/products.py`: add optional `user_id: Optional[str] = Query(default=None)` parameter to the `/products` search endpoint
    - In the endpoint handler, retrieve `exclusion_set` via `get_exclusion_set(user_id)` and pass it to `search_products`
    - Modify `backend/app/services/catalog.py`: add optional `exclusion_set: set | None = None` parameter to `search_products`
    - In `search_products`, after fetching results, apply `filter_products(results, exclusion_set)` before slicing to limit
    - Fetch extra results (limit * 2) before filtering to compensate for removals
    - _Requirements: 4.1, 4.2, 4.3, 11.1_

  - [ ]* 5.2 Write unit tests for product search filtering
    - Test that search with a profile user_id returns only safe products
    - Test that search without user_id returns unfiltered results
    - Test that filtered result count may be below limit (no backfill of unsafe products)
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 6. Integrate dietary filtering into NowSpeak AI chat
  - [ ] 6.1 Add profile-aware filtering to intent engine
    - Modify `backend/app/services/intent_engine.py`:
      - Import `get_exclusion_set`, `filter_products`, `get_profile` from `profile_service`
      - In `stream_nowspeak`, after Phase 2 catalog search, retrieve `exclusion_set` via `get_exclusion_set(user_id)`
      - If exclusion_set exists, apply `filter_products` to `found_products`
      - If filtering produces 0 results, retry catalog search without category restriction while still applying exclusion filter
      - In Phase 3, augment `_REPLY_SYSTEM` prompt with diet context string naming the user's specific restrictions (e.g., "The customer has dietary restrictions: vegan, nuts. Acknowledge this briefly.")
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.1_

  - [ ]* 6.2 Write unit tests for NowSpeak diet-aware filtering
    - Test that NowSpeak results are filtered when user has a profile
    - Test retry without category when filter produces zero results
    - Test that system prompt includes diet context when profile exists
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Checkpoint - Verify all backend integrations
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Build frontend profile hook and API client
  - [ ] 8.1 Create profile API client functions
    - Create `frontend/src/lib/profile-api.ts` with functions:
      - `saveProfile(profile: ProfileObject, userId?: string): Promise<ProfileResponse>` — POST to `/api/v1/profile`
      - `getProfile(userId: string): Promise<ProfileResponse>` — GET `/api/v1/profile/{userId}`
      - `getDietMappings(): Promise<Record<string, string[]>>` — GET `/api/v1/profile/mappings/diet`
      - `getAllergenMappings(): Promise<Record<string, string[]>>` — GET `/api/v1/profile/mappings/allergens`
    - Export `ProfileObject` and `ProfileResponse` TypeScript types
    - _Requirements: 1.1, 1.4, 11.6_

  - [ ] 8.2 Create useProfile hook with sessionStorage persistence
    - Create `frontend/src/hooks/useProfile.ts`
    - Store `diet_user_id` in `sessionStorage`
    - On mount, check sessionStorage for existing user_id and fetch profile from backend
    - Expose: `userId`, `profile`, `exclusionSet`, `loading`, `saveProfile()`, `clearProfile()`
    - Handle sessionStorage unavailability gracefully (private browsing)
    - _Requirements: 6.4, 7.1, 11.6_

  - [ ] 8.3 Update existing API functions to pass user_id
    - Modify `frontend/src/lib/api.ts`:
      - `getRecommendations(userId?: string)` already accepts userId — no change needed (verify)
      - `searchProducts(query, limit, userId?)` — add optional userId param and append to query string
      - `openChatStream(message, sessionId, userId?)` already accepts userId — no change needed (verify)
    - _Requirements: 11.6_

- [ ] 9. Build Profile Setup Page UI
  - [ ] 9.1 Create the profile setup page
    - Create `frontend/src/app/profile/page.tsx` as a Next.js route
    - Display a grid of selectable Diet_Tag pill buttons: vegan, vegetarian, keto, halal, pescatarian, gluten-free
    - Display a grid of selectable Allergen_Tag pill buttons: nuts, gluten, dairy, soy, shellfish, eggs
    - Include a free-text input field for custom exclusion keywords (comma-separated)
    - Add "Save Profile" button that calls `saveProfile()` from the hook and stores returned user_id
    - On save success, redirect to home page
    - If user already has a profile, pre-populate selections on page load
    - Ensure the page is accessible (keyboard navigation, ARIA labels on interactive elements)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. Build Profile Banner and integrate with Home Page
  - [ ] 10.1 Create ProfileBanner component
    - Create `frontend/src/components/ProfileBanner/index.tsx`
    - When user has a profile: display green banner with diet/allergen tags as pill chips, tappable to navigate to `/profile`
    - When user has no profile: display yellow CTA banner "Set up dietary profile" linking to `/profile`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 10.2 Integrate ProfileBanner into home page and add header link
    - Modify `frontend/src/app/page.tsx`: import and render `ProfileBanner` below header, passing profile state from `useProfile` hook
    - Pass `userId` from `useProfile` to `getRecommendations` call so the home feed is filtered
    - Modify `frontend/src/components/AmazonHeader/index.tsx`: add a profile icon/link that navigates to `/profile`
    - _Requirements: 6.6, 7.1, 7.2, 7.3, 11.6_

  - [ ]* 10.3 Write unit tests for ProfileBanner component
    - Test banner renders "Set up dietary profile" prompt when no profile exists
    - Test banner renders pill chips with correct tag names when profile is active
    - Test banner is clickable and navigates to `/profile`
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 11. Checkpoint - Verify full MVP flow end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Shared Cart allergen warnings (Stretch)
  - [ ] 12.1 Add conflict detection to cart service
    - Add `check_product_conflicts(product, participant_profiles)` function to `profile_service.py` that checks a product's tags against multiple participants' exclusion sets
    - Modify `backend/app/services/cart_service.py` `add_item` function: after adding an item, retrieve all participants' exclusion sets and call `check_product_conflicts`
    - Include a `warnings` array in the SSE broadcast event with participant name and conflicting tags
    - _Requirements: 5.1, 5.2_

  - [ ] 12.2 Display warning badges in frontend shared cart
    - Create `frontend/src/components/WarningBadge/index.tsx` component
    - Modify shared cart UI to parse `warnings` from SSE events and display warning badge on conflicting product rows
    - Badge shows affected participant name and specific allergen/dietary conflict
    - _Requirements: 5.3, 5.4_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The backend uses in-memory storage — no database setup required
- Frontend state relies on sessionStorage for user_id persistence (no auth)
- Stretch goals (Requirement 5: Shared Cart warnings, Requirement 9: Safe Alternatives, Requirement 10: Explainable badges) are at the end and can be dropped if time is short
- Safe Alternative Suggestions (Req 9) and Explainable Recommendations (Req 10) are omitted from tasks as lower-priority stretch goals that can be layered on after the core MVP

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6", "1.7", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "5.1", "6.1", "8.1"] },
    { "id": 4, "tasks": ["4.2", "5.2", "6.2", "8.2", "8.3"] },
    { "id": 5, "tasks": ["9.1", "10.1"] },
    { "id": 6, "tasks": ["10.2", "10.3"] },
    { "id": 7, "tasks": ["12.1"] },
    { "id": 8, "tasks": ["12.2"] }
  ]
}
```
