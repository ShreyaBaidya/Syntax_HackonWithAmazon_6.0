import type {
  CartResponse,
  IntentRequest,
  OccasionRequest,
  OutcomeRequest,
  URLPromptRequest,
  Occasion,
} from "@/types";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Coupon types (mirrors backend app/models/coupon.py) ───────────────────────

// Coupon types
export type CouponType = "flat" | "percent" | "delivery";
export type CouponResult = {
  code: string;
  label: string;
  description: string;
  type: CouponType;
  min_subtotal: number;
  savings: number;
  eligible: boolean;
  badge?: string | null;
  discount_amount?: number | null;
  discount_rate?: number | null;
  discount_cap?: number | null;
};
export type CouponsResponse = {
  best: CouponResult | null;
  all: CouponResult[];
};
export async function fetchCoupons(
  subtotal: number,
  userId?: string,
): Promise<CouponsResponse> {
  const params = new URLSearchParams({ subtotal: subtotal.toFixed(2) });
  if (userId) params.set("user_id", userId);
  const res = await fetch(`${API_BASE}/api/v1/coupons/best?${params}`);
  if (!res.ok) throw new Error(`Coupons fetch failed: ${res.status}`);
  return res.json();
}

// Product types
export type Product = {
  id: string;
  name: string;
  price: number;
  unit: string;
  image_url: string;
  eta_min: number;
  category: string;
  reason?: string;
  ingredients?: string[];
  dietary_tags?: string[];
  allergen_tags?: string[];
  nutrition_summary?: {
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
  };
  is_alternative?: boolean;
  replaces?: string;
};
export type SSEEvent =
  | { type: "text"; delta: string }
  | { type: "products"; products: Product[] }
  | { type: "done" }
  | { type: "error"; error: string };
export type Recommendations = {
  time_context: string;
  now_suggestions: Product[];
  reorder_nudges: Product[];
  trending: Product[];
  alternatives?: Product[];
};

// Shared Cart types
export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  unit: string;
  image_url: string;
  category: string;
  quantity: number;
  added_by: string[];
};
export type CartState = {
  cart_id: string;
  items: Record<string, CartItem>;
  participants: string[];
  total: number;
  item_count: number;
  created_at: string;
};
export type CartSSEEvent = {
  type:
    | "cart_update"
    | "participant_joined"
    | "participant_left"
    | "checkout"
    | "error";
  cart?: CartState;
  message?: string;
};
export type Order = {
  order_id: string;
  status: string;
  estimated_delivery: string;
  eta_minutes: number;
  total_amount: number;
};
export type OrderHistoryItem = {
  order_id: string;
  status: string;
  estimated_delivery: string;
  eta_minutes: number;
  total_amount: number;
  items: { product_id: string; quantity: number }[];
  delivery_address: string;
  created_at: string;
  payment_method?: string;
};
export type RefillItem = Product & {
  refill_info: {
    avg_gap_days: number;
    days_since_last: number;
    urgency: number;
    frequency: "daily" | "weekly" | "biweekly" | "monthly";
    reason: string;
    last_purchased: string;
  };
  ai_reason?: string;
};
export type RefillGroup = {
  label: string;
  sublabel: string;
  items: RefillItem[];
};
export type RefillSuggestions = {
  bundle_name: string;
  subtitle: string;
  total: number;
  item_count: number;
  items: RefillItem[];
  grouped: { weekly: RefillGroup; biweekly: RefillGroup; monthly: RefillGroup };
};

// Products API
export async function getProductsByCategory(
  category: string,
  limit = 20,
  userId?: string,
): Promise<Product[]> {
  const params = new URLSearchParams({ category, limit: String(limit) });
  if (userId) params.set("user_id", userId);
  const res = await fetch(`${API_BASE}/api/v1/products?${params}`);
  if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.products ?? []);
}
export async function searchProducts(
  query: string,
  limit = 8,
  userId?: string,
): Promise<Product[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (userId) params.set("user_id", userId);
  const res = await fetch(`${API_BASE}/api/v1/products?${params}`);
  if (!res.ok) throw new Error(`Product search failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.products ?? []);
}
export async function getRecommendations(
  userId?: string,
  query?: string,
): Promise<Recommendations> {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  if (query) params.set("query", query);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/api/v1/recommendations${qs}`);
  if (!res.ok) throw new Error(`Recommendations fetch failed: ${res.status}`);
  return res.json();
}
export async function getRefillSuggestions(
  userId?: string,
  cartItemNames?: string[],
): Promise<RefillSuggestions> {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  if (cartItemNames && cartItemNames.length > 0)
    params.set("cart_items", cartItemNames.join(","));
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_BASE}/api/v1/refill-suggestions${qs}`);
  if (!res.ok)
    throw new Error(`Refill suggestions fetch failed: ${res.status}`);
  return res.json();
}

// Calendar-driven event recommendations (demo-enabled for user_002 only)
export type CalendarEventLite = {
  event_id: string;
  title: string;
  description: string;
  time: string;
  location: string;
  type: string;
};
export type EventRecommendations = {
  enabled: boolean;
  events: CalendarEventLite[];
  recommendations: Product[];
};
export async function getEventRecommendations(
  userId: string,
  date?: string,
): Promise<EventRecommendations> {
  const params = new URLSearchParams({ user_id: userId });
  if (date) params.set("date", date);
  const res = await fetch(
    `${API_BASE}/api/v1/calendar/event-recommendations?${params}`,
  );
  if (!res.ok)
    throw new Error(`Event recommendations fetch failed: ${res.status}`);
  return res.json();
}

// Orders API
export async function placeOrder(payload: {
  user_id: string;
  items: { product_id: string; quantity: number }[];
  delivery_address: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/v1/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Order failed: ${res.status}`);
  return res.json();
}
export async function getOrderHistory(
  userId = "demo_user",
): Promise<OrderHistoryItem[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/orders?user_id=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) throw new Error(`Order history failed: ${res.status}`);
  const data = await res.json();
  return data.orders ?? [];
}

// Shared Cart API
export async function createSharedCart(
  participantName: string,
): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_name: participantName }),
  });
  if (!res.ok) throw new Error(`Create cart failed: ${res.status}`);
  return res.json();
}
export async function getSharedCart(cartId: string): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}`);
  if (!res.ok) throw new Error(`Cart not found: ${res.status}`);
  return res.json();
}
export async function joinSharedCart(
  cartId: string,
  participantName: string,
): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_name: participantName }),
  });
  if (!res.ok) throw new Error(`Join cart failed: ${res.status}`);
  return res.json();
}
export async function addToSharedCart(
  cartId: string,
  productId: string,
  participantName: string,
  quantity = 1,
): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      participant_name: participantName,
      quantity,
    }),
  });
  if (!res.ok) throw new Error(`Add to cart failed: ${res.status}`);
  return res.json();
}
export async function updateCartItemQty(
  cartId: string,
  productId: string,
  quantity: number,
): Promise<CartState> {
  const res = await fetch(
    `${API_BASE}/api/v1/cart/${cartId}/items/${productId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    },
  );
  if (!res.ok) throw new Error(`Update qty failed: ${res.status}`);
  return res.json();
}
export async function removeFromSharedCart(
  cartId: string,
  productId: string,
): Promise<CartState> {
  const res = await fetch(
    `${API_BASE}/api/v1/cart/${cartId}/items/${productId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`Remove from cart failed: ${res.status}`);
  return res.json();
}
export function openCartStream(cartId: string): EventSource {
  return new EventSource(`${API_BASE}/api/v1/cart/${cartId}/stream`);
}
export async function leaveSharedCart(
  cartId: string,
  participantName: string,
): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_name: participantName }),
  });
  if (!res.ok) throw new Error(`Leave cart failed: ${res.status}`);
  return res.json();
}
export async function deleteSharedCart(cartId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete cart failed: ${res.status}`);
}

// Auth API
export type AuthUser = {
  token: string;
  user_id: string;
  name: string;
  email: string;
  avatar: string;
};
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Invalid email or password");
  }
  return res.json();
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { response: { data } };
  }
  return res.json();
}
export async function loginWithGoogle(
  googleEmail: string,
  googleName?: string,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      google_email: googleEmail,
      google_name: googleName,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Google login failed");
  }
  return res.json();
}

// NowSpeak chat
export function openChatStream(
  message: string,
  sessionId: string,
  userId?: string,
): Promise<Response> {
  return fetch(`${API_BASE}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId, user_id: userId }),
  });
}

// AI Shopping Agent types
export type BudgetTier = "budget" | "standard" | "premium";
export type AICartItem = {
  name: string;
  quantity: string;
  category: "essential" | "recommended" | "optional";
  estimated_price?: number;
  substitute_available?: boolean;
  substitutes?: string[];
};
export type NutritionInfo = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
};
export type AICartResponse = {
  intent: string;
  description: string;
  items: AICartItem[];
  total_estimated_price?: number;
  nutrition?: NutritionInfo;
  budget_tier: BudgetTier;
};
export type Occasion = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

// AI Shopping Agent API calls
async function _aiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}
export async function buildCartFromImage(file: File): Promise<AICartResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/v1/cart/image`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Image cart failed: ${res.status}`);
  return res.json();
}
export async function getOccasions(): Promise<Occasion[]> {
  const res = await fetch(`${API_BASE}/api/v1/occasions`);
  if (!res.ok) throw new Error(`Occasions fetch failed: ${res.status}`);
  const data = await res.json();
  return data.occasions;
}

export type FridgeStatus = {
  status: string;
  last_sync: string;
  alerts: number;
  auto_cart: {
    id: string;
    name: string;
    suggested_qty: number;
    reason: string;
  }[];
};

export async function getFridgeStatus(): Promise<FridgeStatus> {
  const res = await fetch(`${API_URL}/api/v1/iot/fridge/status`);
  if (!res.ok) throw new Error(`Fridge status failed: ${res.status}`);
  return res.json();
}

export async function getUpcomingEvents(userId: string) {
  const res = await fetch(
    `${API_URL}/api/v1/calendar/events?user_id=${userId}`,
  );
  if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);
  return res.json();
}
