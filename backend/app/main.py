from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import chat, recommendations, products, orders, cart, refill, coupon, profile
from app.api import calendar as calendar_api, auth, profile
from app.api import ai_routes

_DESCRIPTION = """

---

### Core Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| `GET`  | `/api/v1/products` | Full-text search across 3,781 catalog products |
| `GET`  | `/api/v1/recommendations` | Product recommendations as per user |
| `POST` | `/api/v1/chat` | AI intent → product recommendations (streaming) |
| `POST` | `/api/v1/orders` | Checkout — place & confirm an order |
| `GET`  | `/health` | Liveness probe |

### AI Shopping Agent Endpoints

| Method | Path | What it does |
|--------|------|--------------|
| `POST` | `/api/v1/cart/intent` | Natural language → ready-to-buy cart |
| `POST` | `/api/v1/cart/image` | Upload a fridge/shelf photo → cart |
| `POST` | `/api/v1/cart/url` | Recipe/article URL → cart |
| `POST` | `/api/v1/cart/occasion` | Occasion (party, sick day…) → cart |
| `POST` | `/api/v1/cart/outcome` | Health goal → cart |
| `GET`  | `/api/v1/occasions` | List supported occasions |

---

### Category
`fresh` · `dairy` · `beverages` · `snacks` · `grocery` ·
`personal_care` · `cleaning` · `medicine` · `baby` · `home` · `electronics`
"""

_TAGS_METADATA = [
    {"name": "Products",               "description": "Search and browse the product catalog."},
    {"name": "Recommendations",        "description": "Personalised product recommendation lanes."},
    {"name": "NowSpeak",               "description": "AI chat endpoint — understands user intent and streams product recommendations."},
    {"name": "Orders",                 "description": "Checkout — create and confirm orders."},
    {"name": "Shared Cart",            "description": "Real-time collaborative cart via SSE."},
    {"name": "Profile",                "description": "Dietary & allergen profile management."},
    {"name": "Coupons",                "description": "Server-side coupon evaluation — best coupon + full list with eligibility."},
    {"name": "Auth",                   "description": "Email/password login for the two demo users."},
    {"name": "AI Shopping Assistant",  "description": "Agent pipeline: intent → vision → recipe → nutrition → cart."},
    {"name": "Health",                 "description": "Liveness probe for load-balancer / CI checks."},
]

app = FastAPI(
    title="Amazon Now API",
    version=settings.version,
    description=_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=_TAGS_METADATA,
    contact={"name": "NowSpeak Team — Hackon Amazon 2026"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shreya-dev core routers ───────────────────────────────────────────────────
app.include_router(chat.router,            prefix="/api/v1", tags=["NowSpeak"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["Recommendations"])
app.include_router(products.router,        prefix="/api/v1", tags=["Products"])
app.include_router(orders.router,          prefix="/api/v1", tags=["Orders"])
app.include_router(cart.router,            prefix="/api/v1", tags=["Shared Cart"])
app.include_router(profile.router,         prefix="/api/v1", tags=["Profile"])
app.include_router(refill.router,          prefix="/api/v1", tags=["Recommendations"])
app.include_router(coupon.router,          prefix="/api/v1", tags=["Coupons"])
app.include_router(auth.router,            prefix="/api/v1", tags=["Auth"])
app.include_router(calendar_api.router,    prefix="/api/v1", tags=["Calendar"])

# ── AI Shopping Assistant routers (merged from shopping-assistantAI branch) ──
app.include_router(ai_routes.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.app_name,
        "version": settings.version,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "Amazon Now API", "version": settings.version}
