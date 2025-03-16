
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

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

// Initialize localStorage with default data if empty
const initializeData = () => {
  const storedCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES);
  if (!storedCategories) {
    storageService.setItem(STORAGE_KEYS.CATEGORIES, initialCategories);
  }
  
  const storedProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
  if (!storedProducts) {
    storageService.setItem(STORAGE_KEYS.PRODUCTS, initialProducts);
  }
  
  // Initialize statistics
  updateStatistics();
};

// Initialize data on module load
initializeData();

// Function to update statistics based on current products
const updateStatistics = () => {
  const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
  const categories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
  
  const statistics = {
    totalProducts: products.length,
    stockValue: products.reduce((total, product) => total + (product.costPrice * product.stock), 0),
    outOfStock: products.filter(product => product.stock === 0).length,
    categories: categories.length,
  };
  
  storageService.setItem(STORAGE_KEYS.STATISTICS, statistics);
  return statistics;
};

// Hook for fetching all products
export function useFetchProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      // Convert string dates back to Date objects
      return products.map(product => ({
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      }));
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
      
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      const product = products.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      
      // Convert string dates back to Date objects
      return {
        ...product,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      };
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

// Hook for fetching categories
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
    },
  });
}

// Hook for saving a product (create or update)
export function useSaveProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Product) => {
      // Get current products
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      
      // Find if product already exists
      const existingIndex = products.findIndex(p => p.id === product.id);
      
      if (existingIndex >= 0) {
        // Update existing product
        products[existingIndex] = product;
      } else {
        // Add new product
        products.push(product);
      }
      
      // Save updated products list
      storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
      
      // Update statistics
      updateStatistics();
      
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
      // Get statistics from storage or calculate if not present
      const statistics = storageService.getItem(STORAGE_KEYS.STATISTICS);
      return statistics || updateStatistics();
    },
  });
}
