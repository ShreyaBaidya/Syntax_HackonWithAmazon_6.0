const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ── Shared types ──────────────────────────────────────────────────────────────

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
  nutrition_summary?: { calories?: number; protein?: string; carbs?: string; fat?: string };
  is_alternative?: boolean;
  replaces?: string;
};

export type SSEEvent =
  | { type: 'text'; delta: string }
  | { type: 'products'; products: Product[] }
  | { type: 'done' }
  | { type: 'error'; error: string };

export type Recommendations = {
  time_context: string;
  now_suggestions: Product[];
  reorder_nudges: Product[];
  trending: Product[];
  alternatives?: Product[];
};

// ── Shared Cart types ─────────────────────────────────────────────────────────

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  unit: string;
  image_url: string;
  category: string;
  quantity: number;
  added_by: string;
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
  type: 'cart_update' | 'participant_joined' | 'participant_left' | 'checkout' | 'error';
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

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getProductsByCategory(
  category: string,
  limit = 20,
  userId?: string,
): Promise<Product[]> {
  const params = new URLSearchParams({ category, limit: String(limit) });
  if (userId) {
    params.set('user_id', userId);
  }
  const res = await fetch(`${API_BASE}/api/v1/products?${params}`);
  if (!res.ok) throw new Error(`Products fetch failed: ${res.status}`);
  const data = await res.json();
  // Backend returns { products: [...], total: N }
  return Array.isArray(data) ? data : (data.products ?? []);
}

export async function searchProducts(query: string, limit = 8, userId?: string): Promise<Product[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (userId) {
    params.set('user_id', userId);
  }
  const res = await fetch(`${API_BASE}/api/v1/products?${params}`);
  if (!res.ok) throw new Error(`Product search failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.products ?? []);
}

export async function getRecommendations(userId?: string, query?: string): Promise<Recommendations> {
  const params = new URLSearchParams();
  if (userId) params.set('user_id', userId);
  if (query) params.set('query', query);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const url = `${API_BASE}/api/v1/recommendations${qs}`;
  console.log('[API] getRecommendations →', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Recommendations fetch failed: ${res.status}`);
  const data = await res.json();
  console.log('[API] getRecommendations response — now_suggestions:', data.now_suggestions?.length, ', trending:', data.trending?.length);
  return data;
}

export async function placeOrder(payload: {
  user_id: string;
  items: { product_id: string; quantity: number }[];
  delivery_address: string;
}): Promise<Order> {
  const res = await fetch(`${API_BASE}/api/v1/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Order failed: ${res.status}`);
  return res.json();
}

// ── Shared Cart API ───────────────────────────────────────────────────────────

export async function createSharedCart(participantName: string): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function joinSharedCart(cartId: string, participantName: string): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_id: productId, participant_name: participantName, quantity }),
  });
  if (!res.ok) throw new Error(`Add to cart failed: ${res.status}`);
  return res.json();
}

export async function updateCartItemQty(
  cartId: string,
  productId: string,
  quantity: number,
): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}/items/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error(`Update qty failed: ${res.status}`);
  return res.json();
}

export async function removeFromSharedCart(
  cartId: string,
  productId: string,
): Promise<CartState> {
  const res = await fetch(`${API_BASE}/api/v1/cart/${cartId}/items/${productId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Remove from cart failed: ${res.status}`);
  return res.json();
}

export function openCartStream(cartId: string): EventSource {
  return new EventSource(`${API_BASE}/api/v1/cart/${cartId}/stream`);
}

/**
 * Opens an SSE stream to the NowSpeak chat endpoint.
 * Returns the raw Response so callers can consume the ReadableStream.
 */
export function openChatStream(
  message: string,
  sessionId: string,
  userId?: string,
): Promise<Response> {
  return fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId, user_id: userId }),
  });
}
