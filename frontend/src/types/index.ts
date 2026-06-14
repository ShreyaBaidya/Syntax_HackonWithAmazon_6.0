export type BudgetTier = 'budget' | 'standard' | 'premium';
export type ItemCategory = 'essential' | 'recommended' | 'optional';

export interface CartItem {
  name: string;
  quantity: string;
  category: ItemCategory;
  estimated_price?: number;
  substitute_available: boolean;
  substitutes: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface CartResponse {
  intent: string;
  description: string;
  items: CartItem[];
  total_estimated_price?: number;
  nutrition?: NutritionInfo;
  budget_tier: BudgetTier;
}

export interface Occasion {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface IntentRequest {
  query: string;
  budget_tier: BudgetTier;
  dietary_preferences: string[];
}

export interface OccasionRequest {
  occasion: string;
  guests: number;
  budget_tier: BudgetTier;
  dietary_preferences: string[];
}

export interface OutcomeRequest {
  goal: string;
  budget_tier: BudgetTier;
  dietary_preferences: string[];
}

export interface URLPromptRequest {
  url: string;
  prompt?: string;
  budget_tier: BudgetTier;
}
