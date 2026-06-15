# Amazon Now — End-to-End Demo & Test Guide

## ✅ Status: MVP Ready for Demo

### What's Working

**Backend (FastAPI)**
- ✅ NowSpeak intent engine (NVIDIA LLM → product search)
- ✅ SSE streaming (word-by-word text + product cards)
- ✅ Full product catalog (5000 Amazon + 200 food + 50 curated)
- ✅ Order creation with correct price calculations
- ✅ Recommendations endpoint (hardcoded for MVP)
- ✅ All API endpoints wired

**Frontend (Next.js)**
- ✅ Home page with recommendation feed + NowSpeak CTA
- ✅ NowSpeak page with voice + text input
- ✅ Product cards with dynamic UX
- ✅ Order summary with editable quantities
- ✅ Speed checkout (mock payment, no biometric)
- ✅ Order confirmation with tracking info

---

## 🚀 Running the System

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
# Opens at http://localhost:3000 (or 3006 if port taken)
```

---

## 🎬 Three Demo Scenarios (30 seconds each)

### Scenario 1: Medical Emergency 🤒
**Path:** Home → NowSpeak → Voice input

1. Go to http://localhost:3006
2. Click **"NowSpeak™ — Just say what you need"** banner
3. Click mic icon, speak: *"I have a fever and need medicine"*
4. Watch SSE stream products in real-time
5. Tap **"Paracetamol"** → qty 1 → **"Order Now"**
6. See order confirmation in 28 min ✅

### Scenario 2: Morning Routine ☀️
**Path:** Home → Product tap → Checkout

1. Go to home page (refreshes recommendations)
2. Look for "Now Suggestions" lane (coffee, milk, bread visible)
3. Tap **"Sleepy Owl Coffee"**
4. Quantity: 1
5. **"Order Now"** → Checkout with Face ID animation
6. Order placed ✅

### Scenario 3: Last-Minute Party 🎉
**Path:** Home → NowSpeak → Complex request

1. Go to NowSpeak
2. Type: *"8 people coming over, need party snacks and drinks for tonight"*
3. AI suggests: chips, sodas, plates, cups (watch cart auto-populate)
4. Review quantities in summary
5. Edit if needed (e.g., increase chips qty)
6. **"Order Now"** → Confirm
7. Order placed with all items ✅

---

## 🧪 API Testing (Curl)

### Test 1: NowSpeak Streaming
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have a fever",
    "session_id": "demo-session",
    "user_id": "demo_user"
  }' \
  --output /dev/stdout | grep -o '"type"' | wc -l
# Expected: 7+ events (text deltas + products + done)
```

### Test 2: Order with Correct Total
```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo_user",
    "items": [
      {"product_id": "B0TWK78A41", "quantity": 1},
      {"product_id": "B0AW25XJGP", "quantity": 2}
    ],
    "delivery_address": "Demo Address"
  }' | jq '.total_amount'
# Expected: ₹599.50 (522.2 + 38.95*2)
```

### Test 3: Product Search
```bash
curl "http://localhost:8000/api/v1/products?q=fever&limit=3" | jq '.products | length'
# Expected: 3+ medicine products
```

---

## 🔧 Known Issues & Fixes Applied

### Issue 1: Order Total = ₹0 ❌ → ✅ FIXED
**Problem:** Orders API was searching only the 50-product seed, not the 5000 Amazon products.
**Fix:** Updated orders.py to use `ALL_PRODUCTS = AMAZON_PRODUCTS + FOOD_ENHANCED_PRODUCTS + PRODUCTS`
**Commit:** `03002f0`

### Issue 2: Frontend API URL (if port changes)
**Check:** `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
**Fix:** Update if backend runs on different port (e.g., 8001)

### Issue 3: CORS / SSE Streaming
**Status:** ✅ CORS configured in FastAPI (`allow_origins=["*"]`)
**Status:** ✅ SSE headers set correctly

---

## 📊 Metrics Checklist

- [ ] **Speed**: NowSpeak message to products in <2s
- [ ] **Accuracy**: "fever" query returns medicine products (not random)
- [ ] **Completeness**: Order summary shows correct items + total + ETA
- [ ] **Polish**: Order confirmation shows order_id + 28 min delivery
- [ ] **Editing**: User can change qty in summary before confirming
- [ ] **SSE**: Streamed text appears word-by-word (not all at once)

---

## 🎯 Demo Recording Script

```
[SCENE 1: Open home page at http://localhost:3006]
"Amazon Now helps urgent shoppers get what they need in 30 minutes.
Two ways: tap a product from our smart feed, or just describe what you need."

[SCENE 2: Click NowSpeak banner → Speak "I have a fever"]
"Watch NowSpeak understand your need in real-time. It searches our catalog,
finds relevant products, and streams the response word by word."

[SCENE 3: Tap first product → See order summary]
"See exactly what you're buying: name, quantity, price, delivery time.
Edit quantities on the fly if needed."

[SCENE 4: Click "Order Now" → Animation → Confirmation]
"Place your order in seconds. Mock Face ID confirmation, then you're done.
Everything arrives in 28 minutes."

[END]
"Amazon Now: Urgent Shopping, Perfectly Simple."
```

---

## 🔄 Next Steps (Post-MVP)

1. **Smart fridge integration** — hardcoded data → real API calls
2. **Recipe image parsing** — mock ingredient extraction → CV model
3. **Monthly analytics** — suggest frequent items automatically
4. **Occasion bundles** — pre-curated bundles (party kit, sick day, etc.)
5. **Multi-user cart** — shared carts with link sharing
6. **Real payment** — mock → Stripe integration

---

## 📝 Testing Checklist

Before demo:
- [ ] Backend: `python -m uvicorn app.main:app --reload --port 8000` (running)
- [ ] Frontend: `npm run dev` (running on 3000/3006)
- [ ] Product search: `/api/v1/products?q=coffee` returns results
- [ ] NowSpeak: `POST /api/v1/chat` streams SSE events
- [ ] Orders: `/api/v1/orders` returns order with non-zero total
- [ ] Home page loads recommendations
- [ ] NowSpeak page loads with mic button + quick prompts
- [ ] Click a quick prompt → products appear in cart
- [ ] Cart button shows item count + total
- [ ] Checkout shows order summary with editable quantities
- [ ] "Order Now" button shows confirmation

✅ All set!
