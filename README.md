# 🚀 Amazon Now — Reimagining Urgent Shopping

> **Hackon Amazon 2026**  
> *Stop searching. Just speak. Get it in 30 minutes.*

---

## 🧩 Problem Statement

Quick-commerce customers are **fundamentally different** from traditional e-commerce customers. They arrive with an immediate need and expect to complete their purchase within seconds — yet today's experience still forces them to search, browse, and make manual decisions.

> *How might we help customers discover, decide, and purchase what they need in the fastest and most effortless way possible?*

---

## 💡 Our Solution: NowSpeak™

**NowSpeak** is a unified voice + chat AI interface that lets customers **describe their situation** instead of searching for a product.

| Old Way | NowSpeak |
|---------|----------|
| Open app → tap search → type "ibuprofen" → filter → browse → add to cart → checkout | Say *"I have a fever and need medicine fast"* → AI finds it → 1 tap → ordered |

**The core insight**: Urgent shoppers don't want to browse — they want to be *understood*. NowSpeak processes voice and text through the **same Amazon Bedrock pipeline**, so the experience is identical regardless of how the customer communicates.

---

## ✨ Key Features

### 🎙️ NowSpeak — Unified Voice + Chat
- Tap the mic or type — same AI processes both
- Powered by Amazon Bedrock (Claude) with tool-use for real-time catalog search
- Streams responses word-by-word for a live, conversational feel
- Multi-turn conversation: refine your request naturally

### 🤖 AI Smart Recommendations
- App surface shows **"What you need right now"** before you even type
- Powered by time-of-day, day-of-week, and personal order history
- Three lanes: **Now Suggestions** / **Reorder Nudges** / **Trending Near You**
- Example: 7 AM Monday → coffee, vitamins, commute snacks appear automatically

<!-- ### ⚡ Speed Checkout
- Tap product → set quantity → **"Order Now"**
- Live ETA shown *before* you confirm (not after)
- Mock biometric confirmation (Face ID animation) — no cart, no review page
- `POST /api/v1/orders` creates order and returns tracking ID in <500ms -->

### 📦 Emergency Bundles *(bonus)*
Pre-curated one-tap bundles for common urgent situations:
- 🤒 Sick Day Kit — fever meds, ORS, tissues, soup
- 🎉 Last-Minute Party — snacks, drinks, plates, cups
- 🔌 Power Outage Kit — torch, candles, power bank, batteries
- 🧹 Cleaning Emergency — stain remover, disinfectant, wipes 

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  FRONTEND (Next.js PWA)              │
│   Home (Recommendations) · NowSpeak · Checkout      │
└──────────────────────────┬──────────────────────────┘
                           │  HTTPS + SSE
         ┌─────────────────┼──────────────────┐
         │                 │                  │
    POST /chat        GET /recs          POST /orders
         │                 │                  │
┌────────▼─────────────────▼──────────────────▼──────┐
│          FastAPI on AWS Lambda (via Mangum)         │
│                                                     │
│  ┌──────────────────┐   ┌────────────────────────┐  │
│  │  IntentEngine    │   │  RecommendationService │  │
│  │  (chat.py)       │   │  (recommendation.py)   │  │
│  └────────┬─────────┘   └──────────┬─────────────┘  │
│           │                        │                │
└───────────┼────────────────────────┼────────────────┘
            │                        │
   ┌────────▼────────┐      ┌────────▼────────┐
   │ Amazon Bedrock  │      │ Amazon Bedrock  │
   │ Claude 3.5 Haiku│      │ Claude 3 Haiku  │
   │ (tool-use + SSE)│      │ (JSON recs)     │
   └────────┬────────┘      └────────┬────────┘
            │                        │
   ┌────────▼────────────────────────▼────────┐
   │           Amazon DynamoDB                │
   │   products-table · orders-table          │
   └──────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 15 + Tailwind CSS | Fast to build, PWA gives mobile feel, Web Speech API for voice |
| AI / NLP | Amazon Bedrock (Claude 3.5 Haiku) | Fastest Bedrock model, critical for <2s chat latency |
| AI / Recs | Amazon Bedrock (Claude 3 Haiku) | Structured JSON output for recommendations |
| Backend | Python FastAPI | Async-native, auto OpenAPI docs, SSE streaming support |
| Serverless | AWS Lambda + Mangum | Zero-config ASGI bridge, scales to zero |
| API Gateway | AWS API Gateway (SAM) | Managed routing, auth, throttling |
| Database | Amazon DynamoDB | Serverless, no cold-start connection issues |
| IaC | AWS SAM (`template.yaml`) | Declarative Lambda + API GW + DynamoDB in one file |
| Streaming | Server-Sent Events (SSE) | Real-time word-by-word feel, simpler than WebSocket |

---

## 📁 Project Structure

```
urgentShopping/
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI app, CORS, router registration
│   │   ├── api/
│   │   │   ├── chat.py               # POST /api/v1/chat  (NowSpeak — SSE)
│   │   │   ├── recommendations.py    # GET  /api/v1/recommendations
│   │   │   ├── products.py           # GET  /api/v1/products?q=...
│   │   │   └── orders.py             # POST /api/v1/orders
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic BaseSettings (reads .env)
│   │   │   └── bedrock.py            # boto3 Bedrock client + SSE stream helper
│   │   ├── services/
│   │   │   ├── intent_engine.py      # Tool-use loop + SSE orchestration
│   │   │   ├── recommendation.py     # Context signals → Bedrock → product IDs
│   │   │   └── catalog.py            # DynamoDB product search
│   │   ├── models/
│   │   │   ├── chat.py               # ChatRequest, SSEEvent types
│   │   │   ├── product.py            # Product, ProductCard
│   │   │   └── order.py              # OrderRequest, OrderResponse
│   │   └── db/
│   │       ├── dynamo.py             # DynamoDB client wrapper
│   │       └── seed.py               # Seeds 50 mock products across 10 categories
│   ├── requirements.txt
│   ├── template.yaml                 # AWS SAM: Lambda + API GW + DynamoDB tables
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Home — AI recommendations feed
│   │   │   ├── nowspeak/page.tsx     # Voice + Chat interface
│   │   │   └── checkout/page.tsx    # Speed checkout screen
│   │   ├── components/
│   │   │   ├── NowSpeak/            # Mic + text input, SSE stream consumer
│   │   │   ├── ProductCard/         # Product card with ETA badge
│   │   │   ├── RecommendationFeed/  # Three-lane home feed
│   │   │   └── SpeedCheckout/       # Biometric mock + 1-tap confirm
│   │   ├── hooks/
│   │   │   ├── useVoiceInput.ts     # Web Speech API (start/stop/transcript)
│   │   │   └── useNowSpeak.ts       # Chat state + SSE EventSource consumer
│   │   └── lib/
│   │       └── api.ts               # Typed API client (fetch + EventSource)
│   └── package.json
│
├── docs/
│   └── architecture.md
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- AWS CLI configured (`aws configure`)
- AWS SAM CLI (`sam --version`)
- Amazon Bedrock access enabled in `us-east-1` for `claude-3-5-haiku` and `claude-3-haiku`

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set AWS_REGION, BEDROCK_MODEL_ID, DYNAMODB_TABLE_PRODUCTS, etc.

# Seed mock product catalog
python -m app.db.seed

# Run locally
uvicorn app.main:app --reload --port 8000
# → Swagger UI: http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API endpoint
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run dev server
npm run dev
# → App: http://localhost:3000
```

### Deploy to AWS

```bash
cd backend

# Build + deploy Lambda + API Gateway + DynamoDB
sam build
sam deploy --guided   # First time: sets stack name, region, S3 bucket
```

---

## 📡 API Reference

### `POST /api/v1/chat` — NowSpeak (SSE Stream)

Accepts a user message (text or voice transcript). Returns a Server-Sent Events stream.

**Request:**
```json
{
  "message": "I have a fever and need medicine fast",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_123"
}
```

**Response (SSE stream):**
```
data: {"type": "text", "delta": "I understand — let me find what you need right away. "}
data: {"type": "text", "delta": "Here are the fastest options:"}
data: {"type": "products", "products": [
  {"id": "p001", "name": "Paracetamol 500mg (10 tabs)", "price": 45, "eta_min": 28, "image_url": "..."},
  {"id": "p002", "name": "Ibuprofen 400mg (15 tabs)", "price": 72, "eta_min": 28, "image_url": "..."}
]}
data: {"type": "done"}
```

---

### `GET /api/v1/recommendations` — Smart Recommendations

**Query params:** `user_id` (optional)

**Response:**
```json
{
  "now_suggestions": [
    {"id": "p010", "name": "Nescafé Classic 200g", "reason": "Good morning! ☀️", "price": 189, "eta_min": 22}
  ],
  "reorder_nudges": [
    {"id": "p031", "name": "Amul Full Cream Milk 1L", "reason": "You ordered this 5 days ago", "price": 66, "eta_min": 18}
  ],
  "trending": [
    {"id": "p045", "name": "Oreo Cookies 150g", "price": 40, "eta_min": 25}
  ]
}
```

---

### `GET /api/v1/products` — Product Search

**Query params:** `q` (search query), `category` (optional), `limit` (default 10)

**Response:**
```json
{
  "products": [{"id": "...", "name": "...", "price": 99, "eta_min": 28, "category": "medicine"}],
  "total": 4
}
```

---

### `POST /api/v1/orders` — Place Order

**Request:**
```json
{
  "user_id": "user_123",
  "items": [{"product_id": "p001", "quantity": 2}],
  "delivery_address": "Flat 4B, Residency Towers, Koramangala"
}
```

**Response:**
```json
{
  "order_id": "ORD-20260613-8842",
  "status": "confirmed",
  "estimated_delivery": "2026-06-13T14:42:00Z",
  "eta_minutes": 28,
  "total_amount": 90
}
```

---

## 🗓️ 3-Day Hackathon Roadmap

### Day 1 — Foundation & AI Core

| Time | Task | Output |
|------|------|--------|
| AM | Repo init, Python venv, FastAPI skeleton | Running `GET /health` endpoint |
| AM | AWS SAM template: Lambda + API GW + DynamoDB tables | Deployed infrastructure |
| AM | `seed.py`: 50 products across 10 categories | Populated products table |
| PM | `bedrock.py`: boto3 client + `invoke_model_with_response_stream` helper | Streaming Claude responses |
| PM | `intent_engine.py`: tool-use loop + SSE orchestration | `POST /chat` working via curl |
| PM | `recommendation.py`: time context → Bedrock → product IDs | `GET /recommendations` working |

### Day 2 — Frontend & Integration

| Time | Task | Output |
|------|------|--------|
| AM | Next.js scaffold, Tailwind, app routing | Running skeleton at localhost:3000 |
| AM | `useVoiceInput.ts`: Web Speech API wrapper | Voice transcript in browser console |
| AM | `useNowSpeak.ts`: SSE EventSource consumer | Streaming text to state |
| AM | `NowSpeak` component: mic button + text input + product cards | Full UI component rendering |
| PM | Home page: `RecommendationFeed` with three lanes | Home page with live data |
| PM | `SpeedCheckout`: product tap → quantity → biometric mock → confirm | End-to-end purchase flow |
| PM | End-to-end: voice → backend → Bedrock → SSE → UI | Full demo scenario works |

### Day 3 — Polish & Demo

| Time | Task | Output |
|------|------|--------|
| AM | Error handling: empty results, Bedrock timeout, network failure | Graceful fallback states |
| AM | UI polish: animations, loading skeletons, ETA badges, urgency colour coding | Polished UI |
| PM | Demo script: 3 judge scenarios scripted and rehearsed | Smooth 5-min demo |
| PM | Pitch deck, talking points, README finalized | Submission-ready |

---

## 📊 Success Metrics

| Metric | Baseline (Today) | NowSpeak Target |
|--------|-----------------|-----------------|
| Time from app open → order placed | 4–6 minutes | **< 30 seconds** |
| Number of taps to checkout | 12–15 | **3 taps** |
| Steps requiring active decision | 6+ | **1 (confirm)** |
| Cart abandonment | ~70% | **< 20%** |
| AI intent response latency | N/A | **< 2 seconds** |
| Recommendation relevance | Manual search | **80%+ contextual** |

---

## 🎬 Demo Scenarios

Three scripted scenarios for judges — each completes in under 30 seconds:

### Scenario 1: Medical Emergency 🤒
> User speaks: *"I have a bad headache and fever. Need medicine urgently."*

NowSpeak response: *"Sorry to hear that! Here are the fastest options delivered in 28 min:"*
→ Paracetamol, Ibuprofen, ORS sachets, Digital thermometer
→ User taps Paracetamol → Face ID → **Ordered in 28 min** ✅

### Scenario 2: Morning Routine ☀️
> App opens at 7:45 AM. Recommendations surface automatically.

Home screen shows: *"Good morning! Your usual?"*
→ Nescafé, Amul Milk (reorder nudge: "you ordered 5 days ago"), Bread
→ User taps milk → 1-tap reorder → **Ordered** ✅

### Scenario 3: Last-Minute Party 🎉
> User types: *"Friends coming over in an hour. Need party snacks and drinks."*

NowSpeak: *"On it! Here's what'll arrive in time:"*
→ Lays variety pack, Pepsi 2L, Oreos, Paper plates
→ Emergency Bundle option: **"Party Kit — all 4 items, ₹340 total"**
→ Tap bundle → confirm → **All ordered in one tap** ✅

---

## 🧑‍💻 Team

| Name | Role |
|------|------|
| — | Frontend (Next.js, NowSpeak UI, Voice integration) |
| — | Backend (FastAPI, AWS Lambda, DynamoDB) |
| — | AI/ML (Bedrock, Intent Engine, Recommendations) |
| — | UX Design + Demo Scripting |

---

## 📝 License

Internal hackathon project — Amazon Hackon 2026. All rights reserved.

---

> *"The best shopping experience is the one you never have to think about."*
