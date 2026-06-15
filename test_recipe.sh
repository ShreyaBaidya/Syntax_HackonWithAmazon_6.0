#!/bin/bash

# Test recipe endpoint

API_BASE="${API_BASE:-http://localhost:8000}"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}=== Testing Recipe Endpoint ===${NC}\n"

# Test 1: Recipe list
echo -e "${YELLOW}1️⃣  List available recipes...${NC}"
curl -s "$API_BASE/api/v1/recipes" | jq '.recipes | length' && echo "" || echo "Failed"

# Test 2: Recipe from text
echo -e "${YELLOW}2️⃣  Match recipe from text (carbonara)...${NC}"
curl -s -X POST "$API_BASE/api/v1/recipe" \
  -F "user_text=pasta carbonara for 4" \
  -F "servings=4" | jq '{recipe_name: .recipe_name, product_count: .total_items}' && echo ""

# Test 3: Recipe from URL
echo -e "${YELLOW}3️⃣  Match recipe from URL (biryani)...${NC}"
curl -s -X POST "$API_BASE/api/v1/recipe" \
  -F "recipe_url=https://ndtv.com/biryani-recipe" \
  -F "servings=6" | jq '{recipe_name: .recipe_name, servings: .servings}' && echo ""

# Test 4: Recipe scaling (8 servings)
echo -e "${YELLOW}4️⃣  Test ingredient scaling (8 people)...${NC}"
RESULT=$(curl -s -X POST "$API_BASE/api/v1/recipe" \
  -F "user_text=butter chicken" \
  -F "servings=8")
echo "$RESULT" | jq '{recipe: .recipe_name, servings: .servings, ingredients: [.ingredients[0].name, .ingredients[0].quantity, .ingredients[0].unit]}' && echo ""

echo -e "${GREEN}✅ Recipe tests complete${NC}"
