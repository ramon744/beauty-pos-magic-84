
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService } from '@/services/storage-service';

// Define the Statistics interface
interface ProductStatistics {
  totalProducts: number;
  stockValue: number;
  outOfStock: number;
  categories: number;
}

// Storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  STATISTICS: 'products-statistics',
};

// Initial mock data for categories
const initialCategories: Category[] = [
  { id: '1', name: 'Shampoos' },
  { id: '2', name: 'Condicionadores' },
  { id: '3', name: 'Coloração' },
  { id: '4', name: 'Tratamentos' },
  { id: '5', name: 'Acessórios' },
];

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
    image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['1'],
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
    image: 'https://images.unsplash.com/photo-1598454444427-8babb28c1776?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['1'],
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
    image: 'https://images.unsplash.com/photo-1609097164673-7e236f3e1f3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['2'],
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
    image: 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['3'],
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
    image: 'https://images.unsplash.com/photo-1590159763121-7c9fd312071f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
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
    image: 'https://images.unsplash.com/photo-1617897903246-719242758050?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
    supplierIds: ['2'],
    createdAt: new Date(2022, 8, 25),
    updatedAt: new Date(2022, 12, 10),
  },
];

// Initialize data in localStorage if it doesn't exist
const initializeData = () => {
  const existingProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
  const existingCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES);
  
  if (!existingProducts) {
    storageService.setItem(STORAGE_KEYS.PRODUCTS, initialProducts);
  }
  
  if (!existingCategories) {
    storageService.setItem(STORAGE_KEYS.CATEGORIES, initialCategories);
  }
  
  // Calculate and update statistics
  updateStatistics();
};

// Helper function to calculate statistics
const updateStatistics = () => {
  const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
  const categories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
  
  const statistics: ProductStatistics = {
    totalProducts: products.length,
    stockValue: products.reduce((total, product) => total + (product.costPrice * product.stock), 0),
    outOfStock: products.filter(product => product.stock === 0).length,
    categories: categories.length,
  };
  
  storageService.setItem(STORAGE_KEYS.STATISTICS, statistics);
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
      
      // Update or add the product
      if (index >= 0) {
        products[index] = {
          ...product,
          updatedAt: new Date(),
        };
      } else {
        products.push({
          ...product,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
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
      const stats = storageService.getItem<ProductStatistics>(STORAGE_KEYS.STATISTICS);
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
