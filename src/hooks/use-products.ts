import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

// Get products from storage or use mock data if not available
const getProductsFromStorage = (): Product[] => {
  const storedProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
  
  // Apenas retorne os produtos armazenados, mesmo que seja um array vazio
  if (storedProducts !== null) {
    return storedProducts;
  }
  
  // Se não houver produtos no storage (null), use os dados mockados
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Smartphone XYZ',
      description: 'Latest model with advanced features',
      code: 'SM001',
      category: { id: '1', name: 'Electronics' },
      salePrice: 1999.99,
      costPrice: 1499.99,
      stock: 15,
      minimumStock: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Laptop Pro',
      description: 'High-performance laptop for professionals',
      code: 'LP002',
      category: { id: '1', name: 'Electronics' },
      salePrice: 3499.99,
      costPrice: 2799.99,
      stock: 10,
      minimumStock: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Wireless Headphones',
      description: 'Noise-cancelling wireless headphones',
      code: 'WH003',
      category: { id: '1', name: 'Electronics' },
      salePrice: 299.99,
      costPrice: 199.99,
      stock: 25,
      minimumStock: 8,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];
  
  // Initialize storage with mock data
  storageService.setItem(STORAGE_KEYS.PRODUCTS, mockProducts);
  return mockProducts;
};

// Function to fetch products from storage
const fetchProducts = async (): Promise<Product[]> => {
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const products = getProductsFromStorage();
      // Ensure all products have categories to avoid undefined.name errors
      const validatedProducts = products.map(product => {
        if (!product.category) {
          return {
            ...product,
            category: { id: '0', name: 'Sem categoria' }
          };
        }
        return product;
      });
      resolve(validatedProducts);
    }, 500);
  });
};

// Custom hook that uses fetchProducts but with a simpler name
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
};

// Original hook with more explicit name for consistency with other hooks
export const useFetchProducts = useProducts;

// Fetch a single product by ID
export const useFetchProduct = (productId: string) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      // Simulate API call
      return new Promise<Product | undefined>((resolve) => {
        setTimeout(() => {
          const products = getProductsFromStorage();
          const product = products.find(p => p.id === productId);
          // Ensure product has a category to avoid undefined.name errors
          if (product && !product.category) {
            product.category = { id: '0', name: 'Sem categoria' };
          }
          resolve(product);
        }, 300);
      });
    },
    enabled: !!productId,
  });
};

// Get categories from storage or use mock data if not available
const getCategoriesFromStorage = (): Category[] => {
  const storedCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES);
  
  // Apenas retorne as categorias armazenadas, mesmo que seja um array vazio
  if (storedCategories !== null) {
    return storedCategories;
  }
  
  // Se não houver categorias no storage (null), use os dados mockados
  const mockCategories: Category[] = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Food & Beverages' }
  ];
  
  // Initialize storage with mock data
  storageService.setItem(STORAGE_KEYS.CATEGORIES, mockCategories);
  return mockCategories;
};

// Hook to fetch categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Simulate API call
      return new Promise<Category[]>((resolve) => {
        setTimeout(() => {
          const categories = getCategoriesFromStorage();
          resolve(categories);
        }, 300);
      });
    },
  });
};

// Improved save product function that updates localStorage
export const useSaveProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (product: Product) => {
      return new Promise<Product>((resolve) => {
        setTimeout(() => {
          console.log('Saving product:', product);
          
          // Get current products from storage
          const products = getProductsFromStorage();
          
          // Find if product already exists
          const existingProductIndex = products.findIndex(p => p.id === product.id);
          
          // Ensure product has a category to avoid undefined.name errors
          if (!product.category) {
            product.category = { id: '0', name: 'Sem categoria' };
          }
          
          if (existingProductIndex >= 0) {
            // Update existing product
            products[existingProductIndex] = product;
          } else {
            // Add new product
            products.push(product);
          }
          
          // Save updated products to storage
          storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
          
          resolve(product);
        }, 500);
      });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['productStats'] });
    }
  });
};

// Improved delete product function that updates localStorage
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: string) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          console.log('Deleting product:', productId);
          
          // Get current products from storage
          const products = getProductsFromStorage();
          
          // Filter out the deleted product
          const updatedProducts = products.filter(p => p.id !== productId);
          
          // Save updated products to storage, mesmo que seja um array vazio
          storageService.setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
          
          resolve(productId);
        }, 500);
      });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productStats'] });
    }
  });
};

// Improved stock adjustment function that updates localStorage
export const useStockAdjustment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { productId: string, quantity: number, reason: string }) => {
      return new Promise<typeof data>((resolve) => {
        setTimeout(() => {
          console.log('Adjusting stock:', data);
          
          // Get current products from storage
          const products = getProductsFromStorage();
          
          // Find the product to adjust
          const productIndex = products.findIndex(p => p.id === data.productId);
          
          if (productIndex >= 0) {
            // Update product stock
            products[productIndex].stock += data.quantity;
            products[productIndex].updatedAt = new Date();
            
            // Save updated products to storage
            storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
            
            // Record stock history if needed
            const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
            stockHistory.push({
              id: crypto.randomUUID(),
              productId: data.productId,
              date: new Date(),
              quantity: data.quantity,
              type: data.quantity > 0 ? 'increase' : 'decrease',
              reason: data.reason
            });
            storageService.setItem(STORAGE_KEYS.STOCKS, stockHistory);
          }
          
          resolve(data);
        }, 500);
      });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
      queryClient.invalidateQueries({ queryKey: ['productStats'] });
    }
  });
};

// Updated stock history function to use localStorage
export const useStockHistory = (productId: string) => {
  return useQuery({
    queryKey: ['stockHistory', productId],
    queryFn: async () => {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
          const productHistory = stockHistory.filter(item => item.productId === productId);
          resolve(productHistory);
        }, 300);
      });
    },
    enabled: !!productId,
  });
};

// Updated statistics calculation using real data from storage
export const useStatistics = () => {
  const { data: products } = useFetchProducts();
  const { data: categories } = useCategories();

  return useQuery({
    queryKey: ['productStats'],
    queryFn: async () => {
      // Calculate actual statistics based on products data
      const stats = {
        totalProducts: products?.length || 0,
        stockValue: products?.reduce((total, product) => total + (product.stock * product.costPrice), 0) || 0,
        outOfStock: products?.filter(product => product.stock === 0).length || 0,
        categories: categories?.length || 0,
        lowStock: products?.filter(product => 
          product.minimumStock !== undefined && 
          product.stock > 0 && 
          product.stock <= product.minimumStock
        ).length || 0,
      };
      
      return stats;
    },
    // Ensure the statistics are recalculated when products or categories change
    enabled: !!products && !!categories,
  });
};
