import { ItemCategory, Item } from '../types';
import { addDays, differenceInDays } from 'date-fns';

export const CATEGORY_DEFAULTS: Record<ItemCategory, { daysUntilExpiry: number; icon: string; color: string }> = {
  dairy: { daysUntilExpiry: 7, icon: '🥛', color: '#E0F2FE' },
  meat: { daysUntilExpiry: 3, icon: '🥩', color: '#FEE2E2' },
  produce: { daysUntilExpiry: 5, icon: '🥬', color: '#DCFCE7' },
  bakery: { daysUntilExpiry: 3, icon: '🍞', color: '#FEF3C7' },
  frozen: { daysUntilExpiry: 90, icon: '🧊', color: '#E0E7FF' },
  pantry: { daysUntilExpiry: 30, icon: '🥫', color: '#F3E8FF' },
  other: { daysUntilExpiry: 7, icon: '📦', color: '#F3F4F6' },
};

export function inferCategory(itemName: string): ItemCategory {
  const name = itemName.toLowerCase();

  const patterns: { category: ItemCategory; keywords: string[] }[] = [
    {
      category: 'dairy',
      keywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'eggs', 'cottage', 'ricotta', 'mozzarella']
    },
    {
      category: 'meat',
      keywords: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'bacon', 'sausage', 'ham', 'fish', 'salmon', 'mince', 'steak', 'breast', 'thigh']
    },
    {
      category: 'produce',
      keywords: ['apple', 'banana', 'orange', 'tomato', 'lettuce', 'spinach', 'carrot', 'onion', 'potato', 'broccoli', 'pepper', 'cucumber', 'avocado', 'lemon', 'lime', 'grape', 'berry', 'berries', 'mushroom', 'garlic', 'ginger', 'herb', 'basil', 'parsley', 'cilantro']
    },
    {
      category: 'bakery',
      keywords: ['bread', 'bagel', 'muffin', 'croissant', 'bun', 'roll', 'cake', 'pastry', 'donut', 'dough']
    },
    {
      category: 'frozen',
      keywords: ['frozen', 'ice cream', 'pizza', 'fries']
    },
    {
      category: 'pantry',
      keywords: ['pasta', 'rice', 'cereal', 'sauce', 'soup', 'bean', 'lentil', 'can', 'tin', 'oil', 'vinegar', 'flour', 'sugar', 'salt', 'spice', 'noodle']
    }
  ];

  for (const { category, keywords } of patterns) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

export function suggestExpiryDate(
  itemName: string,
  purchasedAt: Date = new Date()
): Date {
  const category = inferCategory(itemName);
  const defaultDays = CATEGORY_DEFAULTS[category].daysUntilExpiry;
  return addDays(purchasedAt, defaultDays);
}

export function getExpiryUrgency(expiryDate: string): 'expired' | 'critical' | 'warning' | 'ok' {
  const daysUntil = differenceInDays(new Date(expiryDate), new Date());
  
  if (daysUntil < 0) return 'expired';
  if (daysUntil === 0) return 'critical';
  if (daysUntil <= 2) return 'warning';
  return 'ok';
}

export function getExpiryColor(urgency: ReturnType<typeof getExpiryUrgency>): string {
  switch (urgency) {
    case 'expired':
      return '#DC2626';
    case 'critical':
      return '#EF4444';
    case 'warning':
      return '#F59E0B';
    case 'ok':
      return '#22C55E';
  }
}

export function formatExpiryText(expiryDate: string): string {
  const daysUntil = differenceInDays(new Date(expiryDate), new Date());
  
  if (daysUntil < 0) return `Expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`;
  if (daysUntil === 0) return 'Expires today';
  if (daysUntil === 1) return 'Expires tomorrow';
  if (daysUntil <= 7) return `Expires in ${daysUntil} days`;
  
  return `Expires ${new Date(expiryDate).toLocaleDateString()}`;
}

export function sortItemsByExpiry(items: Item[]): Item[] {
  return [...items].sort((a, b) => 
    new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
  );
}

export function groupItemsByExpiry(items: Item[]): {
  expired: Item[];
  expiringToday: Item[];
  expiringSoon: Item[];
  later: Item[];
} {
  const sorted = sortItemsByExpiry(items);
  
  return {
    expired: sorted.filter(i => getExpiryUrgency(i.expiry_date) === 'expired'),
    expiringToday: sorted.filter(i => getExpiryUrgency(i.expiry_date) === 'critical'),
    expiringSoon: sorted.filter(i => getExpiryUrgency(i.expiry_date) === 'warning'),
    later: sorted.filter(i => getExpiryUrgency(i.expiry_date) === 'ok'),
  };
}
