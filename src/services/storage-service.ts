
import { supabase } from '@/integrations/supabase/client';

export const storageService = {
  getItem: <T>(key: string): T | null => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  setItem: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
  clear: (): void => {
    localStorage.clear();
  },
  
  // Supabase methods - these work with both approaches
  getFromSupabase: async <T>(table: string, column: string = '', value: any = null): Promise<T[]> => {
    try {
      let query = supabase.from(table);
      
      if (column && value !== null) {
        query = query.eq(column, value);
      }
      
      const { data, error } = await query.select();
      
      if (error) {
        console.error(`Error fetching from ${table}:`, error);
        // Fallback to localStorage
        const localData = storageService.getItem<T[]>(getStorageKeyForTable(table));
        return localData || [];
      }
      
      return (data as any) || [];
    } catch (err) {
      console.error(`Error in getFromSupabase for ${table}:`, err);
      // Fallback to localStorage
      const localData = storageService.getItem<T[]>(getStorageKeyForTable(table));
      return localData || [];
    }
  },
  
  saveToSupabase: async <T extends { id: string }>(table: string, item: T): Promise<T> => {
    try {
      // Convert camelCase to snake_case for all properties
      const transformed = Object.entries(item).reduce((acc, [key, value]) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = value;
        return acc;
      }, {} as any);
      
      const { data, error } = await supabase
        .from(table)
        .upsert(transformed)
        .select();
      
      if (error) {
        console.error(`Error saving to ${table}:`, error);
        // Just use the original item if there's an error
        return item;
      }
      
      // Convert the result back to camelCase
      if (data && data[0]) {
        const result = Object.entries(data[0]).reduce((acc, [key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as any);
        
        // Also save to localStorage for backup and offline functionality
        const storageKey = getStorageKeyForTable(table);
        if (storageKey) {
          const existingItems = storageService.getItem<T[]>(storageKey) || [];
          const index = existingItems.findIndex(i => i.id === item.id);
          
          if (index >= 0) {
            existingItems[index] = item;
          } else {
            existingItems.push(item);
          }
          
          storageService.setItem(storageKey, existingItems);
        }
        
        return result as T;
      }
      
      return item;
    } catch (err) {
      console.error(`Error in saveToSupabase for ${table}:`, err);
      return item;
    }
  },
  
  removeFromSupabase: async (table: string, id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Error removing from ${table}:`, error);
        return false;
      }
      
      // Also remove from localStorage
      const storageKey = getStorageKeyForTable(table);
      if (storageKey) {
        const existingItems = storageService.getItem<any[]>(storageKey) || [];
        const updatedItems = existingItems.filter(item => item.id !== id);
        storageService.setItem(storageKey, updatedItems);
      }
      
      return true;
    } catch (err) {
      console.error(`Error in removeFromSupabase for ${table}:`, err);
      return false;
    }
  }
};

// Helper to get the appropriate storage key for a table
function getStorageKeyForTable(table: string): string {
  const mapping: Record<string, string> = {
    'products': STORAGE_KEYS.PRODUCTS,
    'categories': STORAGE_KEYS.CATEGORIES,
    'customers': STORAGE_KEYS.CUSTOMERS,
    'users': STORAGE_KEYS.USERS,
    'cashiers': STORAGE_KEYS.CASHIERS,
    'cashier_operations': STORAGE_KEYS.CASHIER_OPERATIONS,
    'orders': STORAGE_KEYS.SALES,
    'promotions': STORAGE_KEYS.PROMOTIONS,
    'stock_history': STORAGE_KEYS.STOCKS,
    'suppliers': 'suppliers'
  };
  
  return mapping[table] || '';
}

// Storage keys - centralizing for future DB migration
export const STORAGE_KEYS = {
  AUTH: 'beautyPosAuth',
  USERS: 'beautyPosUsers',
  PRODUCTS: 'beautyPosProducts',
  CUSTOMERS: 'beautyPosCustomers',
  SALES: 'beautyPosSales',
  PROMOTIONS: 'beautyPosPromotions',
  CASHIERS: 'beautyPosCashiers',
  CASHIER_ASSIGNMENTS: 'beautyPosCashierAssignments',
  CASHIER_OPERATIONS: 'beautyPosCashierOperations',
  
  // Adding the missing keys
  ORDERS: 'beautyPosOrders',
  CATEGORIES: 'beautyPosCategories',
  STOCKS: 'beautyPosStocks',
  PRINTERS: 'beautyPosPrinters',
  CART: 'beautyPosCart',
  CART_CUSTOMER: 'beautyPosCartCustomer',
  PROMOTIONS_STATISTICS: 'beautyPosPromotionsStatistics'
};
