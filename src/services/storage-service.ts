import { supabase } from '@/integrations/supabase/client';
import { fromTable, extractDataFromSupabase } from './supabase-helper';

// Queue for pending operations when offline
let pendingOperations: Array<{
  type: 'save' | 'remove',
  table: string,
  data: any
}> = [];

// Flag to track online status
let isOnline = navigator.onLine;

// Function to process pending operations when back online
const processPendingOperations = async () => {
  if (pendingOperations.length === 0) return;
  
  console.log(`Processing ${pendingOperations.length} pending operations...`);
  
  // Create a copy of the queue and clear it
  const operations = [...pendingOperations];
  pendingOperations = [];
  
  for (const op of operations) {
    try {
      if (op.type === 'save') {
        await storageService.saveToSupabase(op.table, op.data, false);
      } else if (op.type === 'remove') {
        await storageService.removeFromSupabase(op.table, op.data, false);
      }
    } catch (error) {
      console.error(`Failed to process operation:`, op, error);
      // Put failed operations back in the queue
      pendingOperations.push(op);
    }
  }
  
  console.log(`Processed pending operations. ${pendingOperations.length} operations remaining.`);
};

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online, syncing data...');
    isOnline = true;
    processPendingOperations();
  });
  
  window.addEventListener('offline', () => {
    console.log('Offline mode activated');
    isOnline = false;
  });
}

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
  
  // Supabase methods with safe fallbacks to localStorage
  getFromSupabase: async <T>(table: string, column: string = '', value: any = null): Promise<T[]> => {
    if (!isOnline) {
      console.log('Offline: getting data from localStorage');
      const localData = storageService.getItem<T[]>(getStorageKeyForTable(table));
      if (column && value !== null && localData) {
        return localData.filter((item: any) => item[column] === value) || [];
      }
      return localData || [];
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
        // Fallback to localStorage
        const localData = storageService.getItem<T[]>(getStorageKeyForTable(table));
        if (column && value !== null && localData) {
          return localData.filter((item: any) => item[column] === value) || [];
        }
        return localData || [];
      }
      
      // Also update localStorage for offline access
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
      // Fallback to localStorage
      const localData = storageService.getItem<T[]>(getStorageKeyForTable(table));
      if (column && value !== null && localData) {
        return localData.filter((item: any) => item[column] === value) || [];
      }
      return localData || [];
    }
  },
  
  saveToSupabase: async <T extends { id: string }>(table: string, item: T, queueIfOffline: boolean = true): Promise<T> => {
    // Always save to localStorage first for immediate access
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
    
    // If offline, add to pending operations queue and return
    if (!isOnline) {
      console.log('Offline: saving to localStorage only, queuing for sync');
      if (queueIfOffline) {
        pendingOperations.push({
          type: 'save',
          table,
          data: item
        });
      }
      return item;
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
        // We already saved to localStorage above
        if (queueIfOffline) {
          pendingOperations.push({
            type: 'save',
            table,
            data: item
          });
        }
        return item;
      }
      
      // Convert the result back to camelCase if we got data back
      if (data && data[0]) {
        const result = Object.entries(data[0]).reduce((acc, [key, value]) => {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          acc[camelKey] = value;
          return acc;
        }, {} as any);
        
        // Update localStorage with the data from Supabase
        if (storageKey) {
          const existingItems = storageService.getItem<T[]>(storageKey) || [];
          const index = existingItems.findIndex(i => i.id === item.id);
          
          if (index >= 0) {
            existingItems[index] = result as T;
          } else {
            existingItems.push(result as T);
          }
          
          storageService.setItem(storageKey, existingItems);
        }
        
        return result as T;
      }
      
      // If we didn't get data back but the operation succeeded, return the original item
      return item;
    } catch (err) {
      console.error(`Error in saveToSupabase for ${table}:`, err);
      // We already saved to localStorage above
      if (queueIfOffline) {
        pendingOperations.push({
          type: 'save',
          table,
          data: item
        });
      }
      return item;
    }
  },
  
  removeFromSupabase: async (table: string, id: string, queueIfOffline: boolean = true): Promise<boolean> => {
    // Always remove from localStorage first for immediate UI update
    const storageKey = getStorageKeyForTable(table);
    if (storageKey) {
      const existingItems = storageService.getItem<any[]>(storageKey) || [];
      const updatedItems = existingItems.filter(item => item.id !== id);
      
      // Ensure the item is truly gone from localStorage
      if (existingItems.length === updatedItems.length) {
        console.warn(`Item with id ${id} not found in localStorage for ${table}`);
      } else {
        console.log(`Successfully removed item ${id} from localStorage ${table}`);
      }
      
      // Important: Update the localStorage with the filtered items
      storageService.setItem(storageKey, updatedItems);
      
      // Double check the item was removed
      const checkItems = storageService.getItem<any[]>(storageKey) || [];
      const stillExists = checkItems.some(item => item.id === id);
      if (stillExists) {
        console.error(`Failed to remove item ${id} from localStorage, forcing removal`);
        const forceRemove = checkItems.filter(item => item.id !== id);
        storageService.setItem(storageKey, forceRemove);
        
        // Triple check to be absolutely sure
        const finalCheck = storageService.getItem<any[]>(storageKey) || [];
        if (finalCheck.some(item => item.id === id)) {
          console.error(`Still failed to remove item ${id} from localStorage after forced removal`);
          
          // One final desperate attempt - replace the entire array
          const finalArray = [];
          for (const item of finalCheck) {
            if (item.id !== id) {
              finalArray.push(item);
            }
          }
          storageService.setItem(storageKey, finalArray);
        }
      }
    }
    
    // If offline, add to pending operations queue and return
    if (!isOnline) {
      console.log('Offline: removing from localStorage only, queuing for sync');
      if (queueIfOffline) {
        pendingOperations.push({
          type: 'remove',
          table,
          data: id
        });
      }
      return true;
    }
    
    try {
      // Use our helper function to safely access Supabase tables
      const { error } = await fromTable(table).delete().eq('id', id);
      
      if (error) {
        console.error(`Error removing from ${table}:`, error);
        // We already removed from localStorage above
        if (queueIfOffline) {
          pendingOperations.push({
            type: 'remove',
            table,
            data: id
          });
        }
        return true; // Return true to let the UI update
      }
      
      return true;
    } catch (err) {
      console.error(`Error in removeFromSupabase for ${table}:`, err);
      // We already removed from localStorage above
      if (queueIfOffline) {
        pendingOperations.push({
          type: 'remove',
          table,
          data: id
        });
      }
      return true; // Return true to let the UI update
    }
  },
  
  // For manual sync of pending operations
  syncPendingOperations: async (): Promise<{ success: boolean, pendingCount: number }> => {
    if (!isOnline) {
      return { success: false, pendingCount: pendingOperations.length };
    }
    
    await processPendingOperations();
    return { success: true, pendingCount: pendingOperations.length };
  },
  
  // Get number of pending operations
  getPendingOperationsCount: (): number => {
    return pendingOperations.length;
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
