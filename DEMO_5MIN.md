# 5-Minute Amazon Now Demo

**Setup (before demo starts):**
```bash
# Terminal 1: Backend (demo mode)
cd backend && source venv/bin/activate
VISION_DEMO_MODE=1 uvicorn app.main:app --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser: http://localhost:3000
```

---

## Demo Script (5 min total)

### 1️⃣ **Chat/Intent Mode** (2 min)
**What to show:** Voice + NowSpeak AI understanding your situation

```
❌ CLICK: Chat tab (if needed)
→ Say/Type: "I have a fever, need medicine fast"
→ AI extracts intent → Shows 4-5 medicines (paracetamol, honey, cough syrup, thermometer, etc.)
→ Tap "Add to Cart" on 2-3 products
→ Show Order Summary
→ Tap "Order Now" → "Confirming in 28 min" ✅
```

**Talking points:**
- Speech-to-text + AI understands context (fever → medicine, not random products)
- Real-time product search from 5000+ catalog
- Instant add-to-cart, order in <30s
- SSE streaming for live product suggestions

---

### 2️⃣ **Recipe Mode** (2 min)
**What to show:** Gallery click → Auto-ingredient matching → Scaling → Checkout

```
→ CLICK: 🍳 Recipe tab
→ SEE: 6 dish images (2x3 grid: Carbonara, Biryani, Butter Chicken, Paneer Tikka, Pizza, Dal)
→ CLICK: "Biryani" image
→ RESULT: Shows 7 ingredients (Rice 500g, Chicken 800g, Yogurt 200g, Onions 400g, Ghee 100ml, etc.)
→ ADJUST: Drag "Servings" slider from 4 → 8
→ WATCH: All quantities scale (Rice 1000g, Chicken 1600g, Yogurt 400g, Onions 800g, etc.)
→ TAP: "Find Ingredients" 
→ CART: All items auto-add
→ ORDER: Same checkout as Chat mode ✅
```

**Talking points:**
- No hardcoded dropdowns — visual gallery feels native/natural
- Proportional scaling for party sizes (1-12 people)
- Catalog auto-match (searches "basmati rice" → finds Aditya Birla rice, ₹245)
- From meal idea to checkout in 20 seconds

---

### 3️⃣ **Smart Fridge** (1 min)
**What to show:** Photo upload → AI detects what's in fridge → Auto-suggests missing items

```
→ CLICK: 🧊 Fridge tab
→ CLICK: "📸 Tap to scan fridge" button
→ SELECT: Any image file (or use sample.jpg)
→ WAIT: "Analyzing..." (1-2 sec in demo mode)
→ RESULT: Detects items in photo (milk, eggs, butter, cheese)
→ AUTO-ADDS: Missing items (bread, pasta, olive oil, chicken, tomatoes, onions, garlic, yogurt)
→ CART: 12 items (₹1,942) added
→ ORDER ✅
```

**Talking points:**
- Computer vision (NVIDIA models or demo fallback)
- Recognizes what's already in fridge vs. what's missing
- No friction — upload once, cart auto-fills
- Reduces decision-making time to <2 seconds

---

## Key Metrics to Call Out

| Mode | Time | Items | Total |
|------|------|-------|-------|
| Intent (fever) | <30s | 4-5 | ₹500-800 |
| Recipe (Biryani) | <20s | 7 | ₹450-600 |
| Smart Fridge | <15s | 12 | ₹1,500-2,000 |

**MVP Vision:** Any of these 3 inputs → Full cart → Paid order in **<2 minutes**.

---

## Demo Notes

### Do's
✅ Show one flow completely (Chat → Order) before switching modes
✅ Adjust servings slowly so scaling is visible
✅ Say the price out loud ("₹245 for the rice")
✅ Mention 28-minute delivery as differentiator

### Don'ts
❌ Don't refresh page mid-demo (will reset cart)
❌ Don't click multiple products at once (confuses the flow)
❌ Don't upload huge images for Smart Fridge (slow in demo mode)
❌ Don't skip the "Order Now" step — show the confirmation screen

---

## Troubleshooting (if needed)

```bash
# Backend 500 errors?
tail -f /tmp/backend.log

# Frontend not loading recipes?
curl http://localhost:8000/api/v1/recipes | jq .

# Port conflicts?
lsof -i :8000 -t | xargs kill -9

# Smart Fridge not working?
# Make sure VISION_DEMO_MODE=1 is set (no API key needed)
```

---

## Audio/Screen Recording Tips

- Start recording when backend is running (before any clicks)
- Narrate each step: "I have a fever" → "AI suggests medicine" → "Adding to cart" → "Order confirmed"
- Show cart total after each mode
- Pan to clock to highlight 28-min delivery promise
- Total video: ~6 minutes (includes narration pauses)
