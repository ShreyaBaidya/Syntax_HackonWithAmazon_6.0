#!/bin/bash

# End-to-end test script for Amazon Now
# Tests: Backend health → NowSpeak → Orders → Frontend

set -e
API_BASE="${API_BASE:-http://localhost:8000}"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Amazon Now End-to-End Test ===${NC}\n"

# Test 1: Backend health
echo -e "${YELLOW}1️⃣  Testing backend health...${NC}"
if curl -s "$API_BASE/health" | grep -q "ok"; then
  echo -e "${GREEN}✓ Backend running${NC}\n"
else
  echo -e "${RED}✗ Backend not responding at $API_BASE${NC}"
  exit 1
fi

# Test 2: Products endpoint
echo -e "${YELLOW}2️⃣  Testing product search...${NC}"
PRODUCTS=$(curl -s "$API_BASE/api/v1/products?q=fever" | jq '.total')
if [ "$PRODUCTS" -gt 0 ]; then
  echo -e "${GREEN}✓ Found $PRODUCTS fever products${NC}\n"
else
  echo -e "${RED}✗ Product search failed${NC}"
  exit 1
fi

# Test 3: NowSpeak intent engine
echo -e "${YELLOW}3️⃣  Testing NowSpeak (SSE streaming)...${NC}"
RESPONSE=$(timeout 15 curl -s -N -X POST "$API_BASE/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"medicine for fever","session_id":"test","user_id":"demo_user"}')

PRODUCT_COUNT=$(echo "$RESPONSE" | grep '"type": "products"' | jq '.products | length' | head -1)
if [ "$PRODUCT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ NowSpeak returned $PRODUCT_COUNT products${NC}\n"
else
  echo -e "${RED}✗ NowSpeak failed${NC}"
  exit 1
fi

# Test 4: Order creation with calculation
echo -e "${YELLOW}4️⃣  Testing order creation (price calculation)...${NC}"
ORDER=$(curl -s -X POST "$API_BASE/api/v1/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo_user",
    "items": [
      {"product_id": "B0TWK78A41", "quantity": 1}
    ],
    "delivery_address": "Demo Address"
  }')

TOTAL=$(echo "$ORDER" | jq '.total_amount')
ORDER_ID=$(echo "$ORDER" | jq -r '.order_id')

if [ "$TOTAL" != "0" ] && [ "$TOTAL" != "null" ]; then
  echo -e "${GREEN}✓ Order created: $ORDER_ID (₹$TOTAL)${NC}\n"
else
  echo -e "${RED}✗ Order total is ₹0 or missing${NC}"
  exit 1
fi

# Test 5: Frontend connectivity
echo -e "${YELLOW}5️⃣  Testing frontend...${NC}"
if curl -s http://localhost:3000 > /dev/null 2>&1 || curl -s http://localhost:3006 > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend running${NC}\n"
else
  echo -e "${YELLOW}⚠ Frontend not running (run 'cd frontend && npm run dev')${NC}\n"
fi

echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
echo -e "\n${YELLOW}Next: Open http://localhost:3000 and test scenarios:${NC}"
echo "  1️⃣  NowSpeak: Click banner → speak 'I have a fever'"
echo "  2️⃣  Home feed: Tap a coffee product → checkout"
echo "  3️⃣  Party: Go to NowSpeak → type 'party snacks for 8'"
