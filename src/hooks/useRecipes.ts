import { useState, useCallback } from 'react';
import { Item, Recipe } from '../types';
import { generateRecipes } from '../services/openai';

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipes = useCallback(async (
    items: Item[],
    dietaryRestrictions?: string[],
    maxPrepTime?: number,
    count?: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const generatedRecipes = await generateRecipes(
        items,
        dietaryRestrictions as any,
        maxPrepTime,
        count
      );
      
      setRecipes(generatedRecipes);
      return generatedRecipes;
    } catch (err: any) {
      setError(err.message || 'Failed to generate recipes');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRecipes = useCallback(() => {
    setRecipes([]);
  }, []);

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    clearRecipes,
  };
}
