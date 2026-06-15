# Amazon Now — Quick-Commerce MVP

## Vision
**Amazon Now** reimagines urgent shopping for customers who arrive with immediate needs and expect to complete purchases in <30 seconds. Two discovery paths, one powerful intent engine.

## Core Insight
Urgent shoppers don't want to search — they want to be understood. A single AI engine handles all queries: specific needs ("I have a fever"), reorders ("milk again"), complex requests ("8 people coming, need pasta dinner"), and recipe-based shopping ("show me this dish, add all ingredients").

## Key Definitions

### NowSpeak
Unified voice + chat interface. User describes their situation (voice or text) → AI extracts intent → searches catalog → suggests complete cart with quantities → user edits if needed → confirms → order placed in <30s.

### Smart Recommendations (Home Feed)
Home screen shows three lanes (hardcoded for MVP, analytics-driven later):
- **Now Suggestions** — time-of-day signals (7 AM = coffee, milk)
- **Reorder Nudges** — items from past orders
- **Trending Near You** — popular items in category

User taps any product → sees detail → adjusts quantity → checkout (skips NowSpeak).

### Order Summary & Edit
After NowSpeak suggests a cart or home feed tap confirms:
1. Show order summary (items, qty, price, ETA, delivery address)
2. User can edit: change qty, remove items, add items
3. "Confirm Order" button (no biometric in browser, mock payment)
4. Order confirmed → shows tracking + ETA

### Smart Fridge (MVP: Visible But Hardcoded)
Home screen shows low-stock alert (e.g., "Running low on milk? Add to cart"). Data is hardcoded JSON for now; wires to real API later.

### Recipe Image/URL Parsing (MVP: Simplified)
User shares image of pasta dish or recipe link → AI extracts ingredients → adds to cart with assumed portions ("designed for 4 people"). User then edits qty. Does not need perfect computer vision; mock parsing OK for demo.

## Domain Language

| Term | Definition |
|------|-----------|
| **Urgent Shopper** | Arrives with specific/time-sensitive need; prioritizes speed over browsing |
| **Intent** | User's underlying request (need, reorder, occasion, recipe) |
| **Cart** | Ephemeral list of items in browser state (React context); persists to order only on checkout |
| **Order** | Confirmed cart saved to DynamoDB; spawns "Reorder Nudges" on next home visit |
| **Catalog** | ~3,781 products seeded in DynamoDB; searchable by name, category, tags |
| **Occasion** | Preset bundles (party, sick day, etc.) — future feature |
| **Exclusion Set** | Dietary/allergen restrictions per user profile; filters recommendations |

## MVP Scope

### Must Work (for demo)
- ✅ Backend: `/api/v1/products` search
- ⚠️ Backend: `/api/v1/chat` (NowSpeak) → NVIDIA LLM → SSE stream → product cards
- ✅ Backend: `/api/v1/orders` create order
- ⚠️ Frontend: Home feed with products
- ⚠️ Frontend: NowSpeak UI (mic/text input + SSE consumer)
- ⚠️ Frontend: Order summary + edit + confirm

### Can Mock
- Recipe image parsing (hardcode common recipes)
- Payment (skip payment form, direct checkout)
- Smart fridge data (hardcode as JSON config)

### Explicitly Out of Scope for MVP
- Monthly order analysis
- Real smart fridge integration
- Occasion bundles
- Multi-user collaboration
- Native biometric auth

## Technical Stack

| Layer | Technology |
|-------|-----------|
| **AI Intent** | NVIDIA AI Endpoints (z-ai/glm-5.1 or llama-3.1-70b) via LangChain |
| **Backend** | Python FastAPI on local/Lambda |
| **Frontend** | Next.js 15 PWA, React Context for cart state |
| **Streaming** | Server-Sent Events (SSE) for word-by-word responses |
| **Database** | DynamoDB (products, orders) or mock JSON for MVP |
| **Web Speech** | Web Speech API for voice transcription |

## Data Flow: NowSpeak End-to-End

```
User speaks/types
       ↓
POST /api/v1/chat {"message": "...", "session_id": "...", "user_id": "..."}
       ↓
Backend intent_engine:
  1. Extract intent (LLM → query + category)
  2. Catalog search (query + category → product IDs)
  3. Filter by user exclusions (dietary/allergies)
  4. Stream warm reply (LLM → SSE text deltas)
  5. Emit product cards as JSON
       ↓
Frontend SSE consumer:
  1. Display streamed text word-by-word
  2. Collect product cards
  3. Auto-add to cart (React context)
       ↓
Order Summary screen:
  1. Show items + qty + price + ETA
  2. Allow edit (qty, remove, add)
  3. "Confirm Order" → POST /api/v1/orders
       ↓
Order confirmed → show tracking
```

## Current Blockers (to fix for end-to-end demo)

1. **NowSpeak SSE streaming** — `/api/v1/chat` hangs or doesn't return? Check NVIDIA API key, network, timeout.
2. **Frontend NowSpeak component** — SSE consumer not rendering? Check EventSource listener, missing error handling.
3. **Order summary not showing** — Is checkout component wired to cart state? Missing edit UI?
4. **Recommendations not populating** — Hardcoded data or missing API call?

(To be diagnosed and fixed.)
