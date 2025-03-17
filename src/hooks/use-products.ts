import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { useAuth } from '@/contexts/AuthContext';

// Define the Statistics interface
interface ProductStatistics {
  totalProducts: number;
  stockValue: number;
  outOfStock: number;
  categories: number;
  belowMinimumStock: number;
  approachingMinimumStock: number;
}

// Define StockHistory interface
export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  newStock: number;
  adjustmentType: 'balance' | 'add' | 'remove';
  quantity: number;
  reason: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: Date;
}

// Initial mock data for categories
const initialCategories: Category[] = [
  { id: '1', name: 'Shampoos' },
  { id: '2', name: 'Condicionadores' },
  { id: '3', name: 'Coloração' },
  { id: '4', name: 'Tratamentos' },
  { id: '5', name: 'Acessórios' },
];

// Get date in the future (for sample expiration dates)
const getFutureDate = (daysToAdd: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date;
};

// Initial mock data for products
const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Shampoo Hidratante',
    description: 'Shampoo para hidratação profunda',
    code: 'SH001',
    category: initialCategories[0],
    salePrice: 29.90,
    costPrice: 15.50,
    stock: 45,
    minimumStock: 20,
    image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['1'],
    expirationDate: getFutureDate(180), // 6 months expiration
    createdAt: new Date(2023, 1, 15),
    updatedAt: new Date(2023, 3, 10),
  },
  {
    id: '2',
    name: 'Condicionador Reparador',
    description: 'Condicionador para cabelos danificados',
    code: 'CO001',
    category: initialCategories[1],
    salePrice: 34.90,
    costPrice: 17.80,
    stock: 38,
    minimumStock: 25,
    image: 'https://images.unsplash.com/photo-1598454444427-8babb28c1776?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['1'],
    expirationDate: getFutureDate(90), // 3 months expiration
    createdAt: new Date(2023, 1, 15),
    updatedAt: new Date(2023, 3, 10),
  },
  {
    id: '3',
    name: 'Coloração Permanent Blonde',
    description: 'Coloração permanente tons de loiro',
    code: 'TIN001',
    category: initialCategories[2],
    salePrice: 45.90,
    costPrice: 25.30,
    stock: 15,
    minimumStock: 20,
    image: 'https://images.unsplash.com/photo-1609097164673-7e236f3e1f3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['2'],
    expirationDate: getFutureDate(365), // 1 year expiration
    createdAt: new Date(2022, 11, 5),
    updatedAt: new Date(2023, 3, 1),
  },
  {
    id: '4',
    name: 'Máscara de Tratamento Intensivo',
    description: 'Máscara para tratamento intensivo de cabelos',
    code: 'MSK001',
    category: initialCategories[3],
    salePrice: 59.90,
    costPrice: 28.75,
    stock: 22,
    minimumStock: 15,
    image: 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['3'],
    expirationDate: getFutureDate(30), // 1 month expiration (soon to expire)
    createdAt: new Date(2022, 10, 12),
    updatedAt: new Date(2023, 2, 20),
  },
  {
    id: '5',
    name: 'Escova de Cabelo Profissional',
    description: 'Escova para finalização e styling',
    code: 'ACC001',
    category: initialCategories[4],
    salePrice: 89.90,
    costPrice: 45.00,
    stock: 8,
    minimumStock: 10,
    image: 'https://images.unsplash.com/photo-1590159763121-7c9fd312071f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    // No expiration date for non-perishable items
    createdAt: new Date(2022, 9, 30),
    updatedAt: new Date(2023, 1, 15),
  },
  {
    id: '6',
    name: 'Óleo de Argan',
    description: 'Óleo finalizador para cabelos secos',
    code: 'TRT001',
    category: initialCategories[3],
    salePrice: 49.90,
    costPrice: 24.95,
    stock: 0,
    minimumStock: 12,
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['2'],
    expirationDate: getFutureDate(-15), // Expired product for demo
    createdAt: new Date(2022, 8, 25),
    updatedAt: new Date(2022, 12, 10),
  },
];

// Initialize data in localStorage if it doesn't exist
const initializeData = () => {
  storageService.initialize({
    [STORAGE_KEYS.PRODUCTS]: initialProducts,
    [STORAGE_KEYS.CATEGORIES]: initialCategories,
    [STORAGE_KEYS.STOCK_HISTORY]: []
  });
  
  // Calculate and update statistics
  updateStatistics();
};

// Helper function to calculate statistics
const updateStatistics = () => {
  const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
  const categories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
  
  const belowMinimumStock = products.filter(
    product => product.minimumStock && product.stock <= product.minimumStock
  ).length;
  
  const approachingMinimumStock = products.filter(
    product => product.minimumStock && 
              product.stock > product.minimumStock && 
              product.stock <= product.minimumStock * 1.5
  ).length;
  
  const statistics: ProductStatistics = {
    totalProducts: products.length,
    stockValue: products.reduce((total, product) => total + (product.costPrice * product.stock), 0),
    outOfStock: products.filter(product => product.stock === 0).length,
    categories: categories.length,
    belowMinimumStock,
    approachingMinimumStock
  };
  
  storageService.setItem(STORAGE_KEYS.PRODUCTS_STATISTICS, statistics);
  return statistics;
};

// Initialize data
initializeData();

// Hook for fetching all products
export function useFetchProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // Fetch from localStorage
      return storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
    },
  });
}

// Hook for fetching a single product
export function useFetchProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      // Skip the request if id is empty
      if (!id) return null;
      
      // Fetch from localStorage
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      const product = products.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      
      return product;
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

// Hook for fetching categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetch from localStorage
      return storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
    },
  });
}

// Helper function to normalize product data before saving
const normalizeProductData = (product: Product): Product => {
  return {
    ...product,
    // Ensure minimumStock is saved correctly (convert 0 to undefined if needed)
    minimumStock: product.minimumStock === 0 ? undefined : product.minimumStock,
    // Ensure expirationDate is handled properly (null becomes undefined for storage)
    expirationDate: product.expirationDate === null ? undefined : product.expirationDate,
    // Handle potential Date serialization issues by ensuring dates are proper Date objects
    createdAt: new Date(product.createdAt),
    updatedAt: new Date()
  };
};

// Hook for saving a product (create or update)
export function useSaveProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Product) => {
      // Log the product being saved for debugging
      console.log('Saving product:', product);
      
      // Get the current products from localStorage
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      
      // Find if the product already exists
      const index = products.findIndex(p => p.id === product.id);
      
      // Normalize product data before saving
      const normalizedProduct = normalizeProductData(product);
      
      // Update or add the product
      if (index >= 0) {
        products[index] = normalizedProduct;
      } else {
        normalizedProduct.createdAt = new Date();  // Only set createdAt for new products
        products.push(normalizedProduct);
      }
      
      // Save the updated products back to localStorage
      storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
      
      // Update statistics
      updateStatistics();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return product;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// Hook for fetching product statistics
export function useStatistics() {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      // If statistics don't exist, calculate them
      const stats = storageService.getItem<ProductStatistics>(STORAGE_KEYS.PRODUCTS_STATISTICS);
      if (!stats) {
        return updateStatistics();
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return stats;
    },
  });
}

// Hook for deleting a product
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      // Get the current products from localStorage
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      
      // Filter out the product to delete
      const updatedProducts = products.filter(p => p.id !== productId);
      
      // Save the updated products back to localStorage
      storageService.setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
      
      // Update statistics
      updateStatistics();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return productId;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

// New hook for adjusting stock and recording history
export function useStockAdjustment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      product,
      newStock,
      adjustmentType,
      reason
    }: {
      product: Product;
      newStock: number;
      adjustmentType: 'balance' | 'add' | 'remove';
      reason: string;
    }) => {
      if (!user) throw new Error('User must be logged in to adjust stock');
      
      // Calculate quantity based on adjustment type
      const quantity = adjustmentType === 'balance' 
        ? Math.abs(newStock - product.stock)
        : adjustmentType === 'add'
          ? newStock - product.stock
          : product.stock - newStock;
          
      // Get existing history or initialize empty array
      const stockHistory = storageService.getItem<StockHistoryEntry[]>(STORAGE_KEYS.STOCK_HISTORY) || [];
      
      // Create history entry
      const historyEntry: StockHistoryEntry = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        previousStock: product.stock,
        newStock,
        adjustmentType,
        quantity,
        reason,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: new Date()
      };
      
      // Add to history
      stockHistory.push(historyEntry);
      storageService.setItem(STORAGE_KEYS.STOCK_HISTORY, stockHistory);
      
      // Update product stock
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      const productIndex = products.findIndex(p => p.id === product.id);
      
      if (productIndex === -1) throw new Error('Product not found');
      
      // Update the product with new stock
      const updatedProduct = {
        ...products[productIndex],
        stock: newStock,
        updatedAt: new Date()
      };
      
      products[productIndex] = updatedProduct;
      storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
      
      // Update statistics
      updateStatistics();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { updatedProduct, historyEntry };
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['stock-history'] });
    },
  });
}

// Hook for fetching stock history
export function useStockHistory(productId?: string) {
  return useQuery({
    queryKey: ['stock-history', productId],
    queryFn: async () => {
      // Get full history
      const history = storageService.getItem<StockHistoryEntry[]>(STORAGE_KEYS.STOCK_HISTORY) || [];
      
      // Sort by timestamp (newest first)
      const sortedHistory = [...history].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Filter by productId if provided
      return productId 
        ? sortedHistory.filter(entry => entry.productId === productId)
        : sortedHistory;
    },
  });
}
