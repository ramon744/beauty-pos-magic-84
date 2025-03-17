// User roles
export type UserRole = 'admin' | 'manager' | 'employee';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  password?: string; // Add optional password field
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

// Supplier interface
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  contactPerson?: string;
  cnpj: string;
  createdAt: Date;
  updatedAt: Date;
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
  minimumStock?: number;  // Added minimum stock field
  image?: string;
  supplierIds?: string[];
  suppliers?: Supplier[];
  expirationDate?: Date | null;  // Updated to allow null
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
  address?: string; // Street address
  addressNumber?: string; // Added house/building number
  addressComplement?: string; // Added address complement
  cep?: string; // CEP/Postal code
  createdAt: Date;
  updatedAt: Date;
}

// Payment method
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'transfer';

// Payment details
export interface PaymentDetails {
  method: PaymentMethod;
  installments?: number;
  cashReceived?: number;
  change?: number;
  amount?: number;
  isCompletePayment?: boolean;
}

// Mixed payment
export interface MixedPayment {
  payments: PaymentDetails[];
  totalPaid: number;
}

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
  paymentDetails?: PaymentDetails;
  total: number;
  discount: number;
  finalTotal: number;
  seller: User;
  createdAt: Date;
}

// Promotion type
export type PromotionType = 
  | 'discount_percentage' 
  | 'discount_value' 
  | 'buy_x_get_y' 
  | 'fixed_price'
  | 'bundle';

// Promotion interface
export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  description: string;
  discountPercent?: number;
  discountValue?: number;
  fixedPrice?: number;
  buyQuantity?: number;
  getQuantity?: number;
  bundleProducts?: string[];
  bundlePrice?: number;
  productId?: string;
  productIds?: string[]; // Field for multiple products
  secondaryProductId?: string; // Added for "buy X get Y" with different products
  secondaryProductDiscount?: number; // Added discount percentage for secondary product
  categoryId?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  maxDiscountPerPurchase?: number; // Added maximum discount amount per purchase
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
