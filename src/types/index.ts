
// User roles
export type UserRole = 'admin' | 'manager' | 'employee';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Authentication state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product category
export interface Category {
  id: string;
  name: string;
}

// Product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  code: string;
  category: Category;
  salePrice: number;
  costPrice: number;
  stock: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Customer interface
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment method
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer';

// Cart item
export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  discount: number;
}

// Sale interface
export interface Sale {
  id: string;
  items: CartItem[];
  customer?: Customer;
  paymentMethod: PaymentMethod;
  total: number;
  discount: number;
  finalTotal: number;
  seller: User;
  createdAt: Date;
}

// Promotion interface
export interface Promotion {
  id: string;
  name: string;
  productId: string;
  product?: Product;
  discountPercent: number;
  discountPrice?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

// Report types
export type ReportTimeframe = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  timeframe?: ReportTimeframe;
  categoryId?: string;
  productId?: string;
  sellerId?: string;
}
