import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingListItem, MissingIngredient, generateMissingIngredientsFromRecipes } from '../utils/shoppingList';
import { Recipe, Item } from '../types';

const STORAGE_KEY = '@freshtrack_shopping_list';

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveItems = async (newItems: ShoppingListItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      setItems(newItems);
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  };

  const addItem = useCallback(async (
    name: string,
    quantity?: string,
    unit?: string,
    category?: string
  ) => {
    const newItem: ShoppingListItem = {
      id: Date.now().toString(),
      name,
      quantity: quantity || '',
      unit: unit || '',
      category,
      checked: false,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    
    await saveItems([...items, newItem]);
    return newItem;
  }, [items]);

  const addFromMissingIngredients = useCallback(async (
    missingIngredients: MissingIngredient[]
  ) => {
    const newItems: ShoppingListItem[] = missingIngredients.map(ingredient => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: ingredient.name,
      quantity: ingredient.amount,
      unit: ingredient.unit,
      category: ingredient.category,
      checked: false,
      source: 'recipe',
      recipeName: ingredient.sourceRecipe,
      createdAt: new Date().toISOString(),
    }));
    
    const existingNames = items.map(i => i.name.toLowerCase());
    const uniqueNewItems = newItems.filter(
      newItem => !existingNames.includes(newItem.name.toLowerCase())
    );
    
    await saveItems([...items, ...uniqueNewItems]);
    return uniqueNewItems;
  }, [items]);

  const toggleItem = useCallback(async (id: string) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    await saveItems(newItems);
  }, [items]);

  const removeItem = useCallback(async (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    await saveItems(newItems);
  }, [items]);

  const clearChecked = useCallback(async () => {
    const newItems = items.filter(item => !item.checked);
    await saveItems(newItems);
  }, [items]);

  const clearAll = useCallback(async () => {
    await saveItems([]);
  }, []);

  const generateFromRecipes = useCallback(async (
    recipes: Recipe[],
    ownedItems: Item[]
  ) => {
    const missing = generateMissingIngredientsFromRecipes(recipes, ownedItems);
    return addFromMissingIngredients(missing);
  }, [addFromMissingIngredients]);

  const getUncheckedItems = useCallback(() => {
    return items.filter(item => !item.checked);
  }, [items]);

  const getCheckedItems = useCallback(() => {
    return items.filter(item => item.checked);
  }, [items]);

  const getItemsByCategory = useCallback(() => {
    const groups: Record<string, ShoppingListItem[]> = {};
    
    for (const item of items) {
      const category = item.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    }
    
    return groups;
  }, [items]);

  return {
    items,
    loading,
    addItem,
    addFromMissingIngredients,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
    generateFromRecipes,
    getUncheckedItems,
    getCheckedItems,
    getItemsByCategory,
  };
}
