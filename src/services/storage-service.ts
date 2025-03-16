
// Storage service - abstraction layer for future DB migration
// This will make it easier to switch to a real database in the future

export interface StorageService {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

// Constants for storage keys
export const STORAGE_KEYS = {
  USERS: 'salon-app-users',
  PRODUCTS: 'salon-app-products',
  CUSTOMERS: 'salon-app-customers',
  SUPPLIERS: 'salon-app-suppliers',
  CATEGORIES: 'salon-app-categories',
  STATISTICS: 'salon-app-statistics',
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
      localStorage.setItem(key, JSON.stringify(value));
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
}

// Create a singleton instance
export const storageService: StorageService = new LocalStorageService();

// When migrating to a database in the future, create a new implementation of StorageService
// that calls API endpoints instead of using localStorage
