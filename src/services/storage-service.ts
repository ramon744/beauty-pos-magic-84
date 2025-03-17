
// Storage service - abstraction layer for future DB migration
// This will make it easier to switch to a real database in the future

export interface StorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
  initialize(initialData: Record<string, any>): void;
}

// Define storage keys centrally to maintain consistency
export const STORAGE_KEYS = {
  PRODUCTS: 'makeup-pos-products',
  CATEGORIES: 'makeup-pos-categories',
  PRODUCTS_STATISTICS: 'makeup-pos-products-statistics',
  STOCK_HISTORY: 'makeup-pos-stock-history',
  PROMOTIONS: 'promotions',
  PROMOTIONS_STATISTICS: 'promotions-statistics',
  CUSTOMERS: 'customers',
  USERS: 'users',
  CART: 'makeup-pos-cart',
  SUPPLIERS: 'suppliers',
  ORDERS: 'orders'
};

class LocalStorageService implements StorageService {
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): void {
    try {
      const stringValue = JSON.stringify(value, (_, val) => {
        // Handle Date objects during serialization
        if (val instanceof Date) {
          return val.toISOString();
        }
        return val;
      });
      
      localStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error storing ${key} in localStorage:`, error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.setItem(key, '');
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
  
  // Initialize storage with default data if items don't exist
  initialize(initialData: Record<string, any>): void {
    for (const [key, value] of Object.entries(initialData)) {
      if (!this.getItem(key)) {
        this.setItem(key, value);
        console.info(`Initialized ${key} in localStorage`);
      }
    }
  }
}

// Create a singleton instance
export const storageService: StorageService = new LocalStorageService();

// When migrating to a database in the future, create a new implementation of StorageService
// that calls API endpoints instead of using localStorage
