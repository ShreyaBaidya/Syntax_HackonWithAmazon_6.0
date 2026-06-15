const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Profile types ─────────────────────────────────────────────────────────────

export type ProfileObject = {
  diet_tags: string[];
  allergen_tags: string[];
  custom_exclusions: string;
};

export type ProfileResponse = {
  user_id: string;
  profile: ProfileObject;
  exclusion_set: string[];
};

// ── Profile API calls ─────────────────────────────────────────────────────────

/**
 * Create or update a dietary profile.
 * POST /api/v1/profile
 */
export async function saveProfile(
  profile: ProfileObject,
  userId?: string,
): Promise<ProfileResponse> {
  const res = await fetch(`${API_BASE}/api/v1/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId ?? null, profile }),
  });
  if (!res.ok) throw new Error(`Save profile failed: ${res.status}`);
  return res.json();
}

/**
 * Retrieve a stored dietary profile.
 * GET /api/v1/profile/{userId}
 */
export async function getProfile(userId: string): Promise<ProfileResponse> {
  const res = await fetch(
    `${API_BASE}/api/v1/profile/${encodeURIComponent(userId)}`,
  );
  if (!res.ok) throw new Error(`Get profile failed: ${res.status}`);
  return res.json();
}

/**
 * Get all diet tag → exclusion keyword mappings.
 * GET /api/v1/profile/mappings/diet
 */
export async function getDietMappings(): Promise<Record<string, string[]>> {
  const res = await fetch(`${API_BASE}/api/v1/profile/mappings/diet`);
  if (!res.ok) throw new Error(`Get diet mappings failed: ${res.status}`);
  return res.json();
}

/**
 * Get all allergen tag → exclusion keyword mappings.
 * GET /api/v1/profile/mappings/allergens
 */
export async function getAllergenMappings(): Promise<Record<string, string[]>> {
  const res = await fetch(`${API_BASE}/api/v1/profile/mappings/allergens`);
  if (!res.ok) throw new Error(`Get allergen mappings failed: ${res.status}`);
  return res.json();
}
