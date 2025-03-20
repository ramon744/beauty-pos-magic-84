
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
  }
};

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
