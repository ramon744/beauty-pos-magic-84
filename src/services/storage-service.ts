
// This service abstracts storage operations to easily switch between localStorage and Supabase in the future
export const storageService = {
  // Current implementation uses localStorage
  setItem: <T>(key: string, value: T): void => {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error setting item with key "${key}" in localStorage:`, error);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return null;
      }
      return JSON.parse(serializedValue) as T;
    } catch (error) {
      console.error(`Error getting item with key "${key}" from localStorage:`, error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item with key "${key}" from localStorage:`, error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },

  // Future Supabase implementation - these are placeholders that will be implemented when Supabase is integrated
  // They maintain the same interface so existing code won't need to change
  supabase: {
    setItem: async <T>(table: string, value: T): Promise<void> => {
      // This will be implemented when Supabase is integrated
      // For now, use localStorage as a fallback
      storageService.setItem(table, value);
    },

    getItem: async <T>(table: string, query?: any): Promise<T | null> => {
      // This will be implemented when Supabase is integrated
      // For now, use localStorage as a fallback
      return storageService.getItem<T>(table);
    },

    removeItem: async (table: string, id: string): Promise<void> => {
      // This will be implemented when Supabase is integrated
      // For now, use localStorage as a fallback
      const items = storageService.getItem<any[]>(table) || [];
      const updatedItems = items.filter(item => item.id !== id);
      storageService.setItem(table, updatedItems);
    },

    clear: async (table: string): Promise<void> => {
      // This will be implemented when Supabase is integrated
      // For now, use localStorage as a fallback
      storageService.removeItem(table);
    }
  },

  // Flag to determine which storage to use (localStorage or Supabase)
  // Set this to true when Supabase is ready to be used
  useSupabase: false,
};

// Use this function when integrating with Supabase to switch from localStorage to Supabase
export const enableSupabaseStorage = () => {
  // This function will be called when Supabase client is initialized
  storageService.useSupabase = true;
  console.log('Storage service switched to Supabase');
};

export const STORAGE_KEYS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  CATEGORIES: 'categories',
  PROMOTIONS: 'promotions',
  PROMOTIONS_STATISTICS: 'promotions_statistics',
  SUPPLIERS: 'suppliers',
  CART: 'cart',
  CART_CUSTOMER: 'cart_customer',
  ORDERS: 'orders',
  THEME: 'theme',
  AUTH: 'auth',
  STOCKS: 'stocks',
  PRINTERS: 'printers', // Added the PRINTERS key
};

// Future Supabase table names - can be the same as STORAGE_KEYS for simplicity
export const SUPABASE_TABLES = {
  ...STORAGE_KEYS
};
