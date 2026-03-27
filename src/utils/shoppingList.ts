import { Item, Recipe } from '../types';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category?: string;
  checked: boolean;
  source: 'recipe' | 'manual';
  recipeName?: string;
  createdAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MissingIngredient {
  name: string;
  amount: string;
  unit: string;
  category?: string;
  sourceRecipe: string;
}

export function generateMissingIngredients(
  recipe: Recipe,
  ownedItems: Item[]
): MissingIngredient[] {
  const ownedNames = ownedItems.map(i => i.name.toLowerCase());
  
  return recipe.ingredients
    .filter(ingredient => {
      const ingredientName = ingredient.name.toLowerCase();
      return !ownedNames.some(owned => 
        owned.includes(ingredientName) || ingredientName.includes(owned)
      );
    })
    .map(ingredient => ({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      category: inferCategoryFromIngredient(ingredient.name),
      sourceRecipe: recipe.name,
    }));
}

export function generateMissingIngredientsFromRecipes(
  recipes: Recipe[],
  ownedItems: Item[]
): MissingIngredient[] {
  const allMissing: MissingIngredient[] = [];
  
  for (const recipe of recipes) {
    const missing = generateMissingIngredients(recipe, ownedItems);
    allMissing.push(...missing);
  }
  
  const uniqueMap = new Map<string, MissingIngredient>();
  for (const item of allMissing) {
    const key = item.name.toLowerCase();
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }
  
  return Array.from(uniqueMap.values());
}

function inferCategoryFromIngredient(name: string): string {
  const nameLower = name.toLowerCase();
  
  const categoryKeywords: Record<string, string[]> = {
    dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'egg'],
    produce: ['apple', 'banana', 'tomato', 'lettuce', 'onion', 'potato', 'carrot', 'pepper', 'garlic', 'lemon', 'lime', 'herb', 'basil'],
    meat: ['chicken', 'beef', 'pork', 'lamb', 'bacon', 'sausage', 'steak', 'mince', 'fillet'],
    bakery: ['bread', 'roll', 'bun', 'bagel'],
    pantry: ['flour', 'sugar', 'salt', 'oil', 'vinegar', 'pasta', 'rice', 'noodle', 'sauce'],
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => nameLower.includes(k))) {
      return category;
    }
  }
  
  return 'other';
}

export function formatShoppingListItem(item: ShoppingListItem): string {
  if (item.quantity && item.unit) {
    return `${item.quantity} ${item.unit} ${item.name}`;
  }
  return item.name;
}

export function groupByCategory(items: ShoppingListItem[]): Record<string, ShoppingListItem[]> {
  const groups: Record<string, ShoppingListItem[]> = {};
  
  for (const item of items) {
    const category = item.category || 'other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
  }
  
  return groups;
}
