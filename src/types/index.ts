export type ItemCategory = 'dairy' | 'meat' | 'produce' | 'bakery' | 'frozen' | 'pantry' | 'other';

export type ItemStatus = 'active' | 'used' | 'wasted';

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  user_id: string;
  name: string;
  category: ItemCategory | null;
  expiry_date: string;
  purchased_at: string;
  quantity: number;
  status: ItemStatus;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  image_url: string | null;
  store_name: string | null;
  total_amount: number | null;
  scanned_at: string;
  items_json: ExtractedItem[] | null;
  confirmed: boolean;
}

export interface ExtractedItem {
  name: string;
  quantity?: number;
  price?: number;
  inferred_category?: ItemCategory;
  suggested_expiry_days?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  servings: number;
  dietary_tags: DietaryTag[];
  image_url?: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  is_expiring_item: boolean;
}

export type DietaryTag = 'vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'nut-free' | 'low-carb' | 'keto' | 'quick';

export interface RecipeGeneration {
  id: string;
  user_id: string;
  items_used: string[];
  recipes_json: Recipe[];
  created_at: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    itemId?: string;
    type: 'expiry_warning' | 'daily_digest' | 'recipe_suggestion';
  };
}
