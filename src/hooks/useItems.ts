import { useState, useEffect, useCallback } from 'react';
import { supabase, getCurrentUser } from '../services/supabase';
import { Item } from '../types';
import { sortItemsByExpiry } from '../utils/expiryCalculator';

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await getCurrentUser();
      if (!user) {
        setItems([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('expiry_date', { ascending: true });

      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (
    name: string,
    expiryDate: string,
    category?: string,
    quantity?: number
  ) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          name,
          expiry_date: expiryDate,
          category: category || null,
          quantity: quantity || 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      setItems(prev => sortItemsByExpiry([...prev, data]));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
      throw err;
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      setItems(prev => sortItemsByExpiry(
        prev.map(item => item.id === id ? data : item)
      ));
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      throw err;
    }
  }, []);

  const markAsUsed = useCallback(async (id: string) => {
    return updateItem(id, { status: 'used' });
  }, [updateItem]);

  const markAsWasted = useCallback(async (id: string) => {
    return updateItem(id, { status: 'wasted' });
  }, [updateItem]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    markAsUsed,
    markAsWasted,
  };
}
