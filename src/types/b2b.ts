import { Item, User } from '../types';

export interface WasteStats {
  totalItems: number;
  itemsUsed: number;
  itemsWasted: number;
  wastePercentage: number;
  averageDaysBeforeExpiry: number;
  mostWastedItems: CategoryStats[];
  wasteByCategory: CategoryStats[];
  weeklyTrend: WeeklyData[];
  customerEngagement: EngagementStats;
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
  wasteCount?: number;
  wastePercentage?: number;
}

export interface WeeklyData {
  week: string;
  itemsTracked: number;
  itemsWasted: number;
  wastePercentage: number;
}

export interface EngagementStats {
  totalUsers: number;
  activeUsersLast30Days: number;
  averageItemsPerUser: number;
  averageItemsWastedPerUser: number;
  retentionRate: number;
  notificationsSent: number;
  notificationOpenRate: number;
}

export interface StoreInsights {
  storeId: string;
  storeName: string;
  region?: string;
  stats: WasteStats;
  topWastedProducts: ProductWaste[];
  recommendations: string[];
}

export interface ProductWaste {
  productName: string;
  category: string;
  wasteCount: number;
  wastePercentage: number;
  potentialSavings: number;
}

export interface B2BUser {
  id: string;
  email: string;
  name: string;
  storeId?: string;
  storeName?: string;
  role: 'admin' | 'retailer' | 'viewer';
  createdAt: string;
}

export interface AggregatedData {
  dateRange: {
    start: string;
    end: string;
  };
  overview: {
    totalItems: number;
    wastePercentage: number;
    trend: number;
  };
  categories: CategoryStats[];
  topProducts: ProductWaste[];
  customerMetrics: EngagementStats;
}
