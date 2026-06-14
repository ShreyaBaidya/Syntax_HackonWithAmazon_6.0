import type { CartResponse, IntentRequest, OccasionRequest, OutcomeRequest, URLPromptRequest, Occasion } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { response: { data } };
  }
  return res.json();
}

export async function buildCartFromIntent(request: IntentRequest): Promise<CartResponse> {
  return post('/api/v1/cart/intent', request);
}

export async function buildCartFromImage(file: File): Promise<CartResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/api/v1/cart/image`, { method: 'POST', body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw { response: { data } };
  }
  return res.json();
}

export async function buildCartFromURL(request: URLPromptRequest): Promise<CartResponse> {
  return post('/api/v1/cart/url', request);
}

export async function buildCartForOccasion(request: OccasionRequest): Promise<CartResponse> {
  return post('/api/v1/cart/occasion', request);
}

export async function buildCartForOutcome(request: OutcomeRequest): Promise<CartResponse> {
  return post('/api/v1/cart/outcome', request);
}

export async function getOccasions(): Promise<Occasion[]> {
  const res = await fetch(`${API_URL}/api/v1/occasions`);
  const data = await res.json();
  return data.occasions;
}
