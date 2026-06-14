from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api import chat, recommendations, products, orders, cart, refill

_DESCRIPTION = """

---

### Endpoints 

| Method | Path | What it does |
|--------|------|--------------|
| `GET`  | `/api/v1/products` | Full-text search across 3,781 catalog products |
| `GET`  | `/api/v1/recommendations` | Product recommendations as per user |
| `POST` | `/api/v1/chat` | AI intent → product recommendations |
| `POST` | `/api/v1/orders` | Checkout — place & confirm an order |
| `GET`  | `/health` | Liveness probe |

---

### Category 
`fresh` · `dairy` · `beverages` · `snacks` · `grocery` ·
`personal_care` · `cleaning` · `medicine` · `baby` · `home` · `electronics`
"""

_TAGS_METADATA = [
    {
        "name": "Products",
        "description": "Search and browse the product catalog.",
    },
    {
        "name": "Recommendations",
        "description": "personalised product recommendation lanes.",
    },
    {
        "name": "NowSpeak",
        "description": (
            "AI chat endpoint that understands user intent and responds with a stream of product recommendations. "
        ),
    },
    {
        "name": "Orders",
        "description": "Checkout — create and confirm orders",
    },
    {
        "name": "Health",
        "description": "Liveness probe for load-balancer / CI checks.",
    },
]

app = FastAPI(
    title="Amazon Now API",
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

app.include_router(chat.router,            prefix="/api/v1", tags=["NowSpeak"])
app.include_router(recommendations.router, prefix="/api/v1", tags=["Recommendations"])
app.include_router(products.router,        prefix="/api/v1", tags=["Products"])
app.include_router(orders.router,          prefix="/api/v1", tags=["Orders"])
app.include_router(cart.router,            prefix="/api/v1", tags=["Shared Cart"])
app.include_router(refill.router,          prefix="/api/v1", tags=["Recommendations"])


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "Amazon Now API", "version": "1.0.0"}
