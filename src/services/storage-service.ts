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
      console.error('Error clearing localStorage:', error);
    }
  }
};

export const STORAGE_KEYS = {
  USERS: 'makeup-pos-users',
  PRODUCTS: 'makeup-pos-products',
  CUSTOMERS: 'makeup-pos-customers',
  CATEGORIES: 'makeup-pos-categories',
  PROMOTIONS: 'makeup-pos-promotions',
  SUPPLIERS: 'makeup-pos-suppliers',
  CART: 'makeup-pos-cart',
  CART_CUSTOMER: 'makeup-pos-cart-customer',
  ORDERS: 'makeup-pos-orders',
  THEME: 'makeup-pos-theme',
  AUTH: 'makeup-pos-auth',
  STOCKS: 'makeup-pos-stocks'
};
