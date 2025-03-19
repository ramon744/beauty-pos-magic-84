
import { supabase } from '@/integrations/supabase/client';
import { fromTable, extractDataFromSupabase } from './supabase-helper';

// Flag to track online status
let isOnline = navigator.onLine;

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

export const storageService = {
  getItem: <T>(key: string): T | null => {
    // Para manter compatibilidade com código existente, ainda permitimos leitura do localStorage
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  
  setItem: <T>(key: string, value: T): void => {
    // Para manter compatibilidade com código existente, ainda permitimos escrita no localStorage
    localStorage.setItem(key, JSON.stringify(value));
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  },
  
  // Supabase methods with online-only behavior
  getFromSupabase: async <T>(table: string, column: string = '', value: any = null): Promise<T[]> => {
    if (!isOnline) {
      throw new Error('Aplicativo está offline. É necessário estar online para acessar os dados.');
    }
    
    try {
      // Use our helper function to safely access Supabase tables
      let query = fromTable(table);
      
      if (column && value !== null) {
        // Apply filter if provided
        query = query.eq(column, value);
      }
      
      const { data, error } = await query.select();
      
      if (error) {
        console.error(`Error fetching from ${table}:`, error);
        throw error;
      }
      
      // Also update localStorage for compatibility with existing code
      if (data.length > 0) {
        const storageKey = getStorageKeyForTable(table);
        if (!column && storageKey) {
          // If this was a full table fetch, update the local storage
          storageService.setItem(storageKey, data);
        } else if (column && storageKey) {
          // If this was a filtered fetch, we need to update just those records
          const allItems = storageService.getItem<any[]>(storageKey) || [];
          
          // Update or add the fetched items to the local data
          const updatedItems = [...allItems];
          for (const item of data) {
            const index = updatedItems.findIndex((i: any) => i.id === (item as any).id);
            if (index >= 0) {
              updatedItems[index] = item;
            } else {
              updatedItems.push(item);
            }
          }
          
          storageService.setItem(storageKey, updatedItems);
        }
      }
      
      return (data as T[]) || [];
    } catch (err) {
      console.error(`Error in getFromSupabase for ${table}:`, err);
      throw err;
    }
  },
  
  saveToSupabase: async <T extends { id: string }>(table: string, item: T): Promise<T> => {
    if (!isOnline) {
      throw new Error('Aplicativo está offline. É necessário estar online para salvar os dados.');
    }
    
    try {
      // Convert camelCase to snake_case for all properties
      const transformed = Object.entries(item).reduce((acc, [key, value]) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        acc[snakeKey] = value;
        return acc;
      }, {} as any);
      
      // Use our helper function to safely access Supabase tables
      const { data, error } = await fromTable(table).upsert(transformed).select();
      
      if (error) {
        console.error(`Error saving to ${table}:`, error);
        throw error;
      }
      
      // Update localStorage for compatibility
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
      
      // Convert the result back to camelCase if we got data back
      if (data && data[0]) {
        const result = Object.entries(data[0]).reduce((acc, [key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as any);
        
        return result as T;
      }
      
      // If we didn't get data back but the operation succeeded, return the original item
      return item;
    } catch (err) {
      console.error(`Error in saveToSupabase for ${table}:`, err);
      throw err;
    }
  },
  
  removeFromSupabase: async (table: string, id: string): Promise<boolean> => {
    if (!isOnline) {
      throw new Error('Aplicativo está offline. É necessário estar online para remover os dados.');
    }
    
    console.log(`Attempting to remove item ${id} from ${table}`);
    
    try {
      // Use our helper function to safely access Supabase tables
      console.log(`Sending delete request to Supabase for table ${table}, id ${id}`);
      const { error } = await fromTable(table).delete().eq('id', id);
      
      if (error) {
        console.error(`Error removing from ${table}:`, error);
        throw error;
      }
      
      // Update localStorage for compatibility
      const storageKey = getStorageKeyForTable(table);
      if (storageKey) {
        console.log(`Removing item ${id} from localStorage ${storageKey}`);
        const existingItems = storageService.getItem<any[]>(storageKey) || [];
        const updatedItems = existingItems.filter(item => item.id !== id);
        
        storageService.setItem(storageKey, updatedItems);
      }
      
      console.log(`Successfully deleted item ${id} from Supabase table ${table}`);
      return true;
    } catch (err) {
      console.error(`Error in removeFromSupabase for ${table}:`, err);
      throw err;
    }
  },
  
  // Remove the offline-specific methods
  getPendingOperationsCount: (): number => {
    return 0; // Não há operações pendentes no modo online-only
  },
  
  syncPendingOperations: async (): Promise<{ success: boolean, pendingCount: number }> => {
    return { success: true, pendingCount: 0 }; // Não há operações para sincronizar no modo online-only
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
