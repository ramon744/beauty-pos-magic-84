export const storageService = {
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
};

export const STORAGE_KEYS = {
  USERS: 'users',
  PRODUCTS: 'products',
  CUSTOMERS: 'customers',
  CATEGORIES: 'categories',
  PROMOTIONS: 'promotions',
  PROMOTIONS_STATISTICS: 'promotions_statistics', // Added this key
  SUPPLIERS: 'suppliers',
  CART: 'cart',
  CART_CUSTOMER: 'cart_customer',
  ORDERS: 'orders',
  THEME: 'theme',
  AUTH: 'auth',
  STOCKS: 'stocks',
};
