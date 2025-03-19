import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

// Get products from storage or use mock data if not available
const getProductsFromStorage = (): Product[] => {
  const storedProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
  if (storedProducts && storedProducts.length > 0) {
    return storedProducts;
  }
  
  // If no products in storage, use mock data
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
      resolve(products);
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
  if (storedCategories && storedCategories.length > 0) {
    return storedCategories;
  }
  
  // If no categories in storage, use mock data
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
          
          // Save updated products to storage
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
    mutationFn: (data: { productId: string, quantity: number, reason: string, adjustmentType?: 'add' | 'remove' | 'balance' }) => {
      return new Promise<typeof data>((resolve) => {
        setTimeout(() => {
          console.log('Adjusting stock:', data);
          
          // Get current products from storage
          const products = getProductsFromStorage();
          
          // Find the product to adjust
          const productIndex = products.findIndex(p => p.id === data.productId);
          
          if (productIndex >= 0) {
            const product = products[productIndex];
            const previousStock = product.stock;
            let newStock = previousStock;
            
            // Determine how to adjust the stock based on the adjustment type
            if (data.adjustmentType === 'remove') {
              // If it's a removal, subtract the quantity
              newStock = previousStock - data.quantity;
            } else if (data.adjustmentType === 'add') {
              // If it's an addition, add the quantity
              newStock = previousStock + data.quantity;
            } else if (data.adjustmentType === 'balance') {
              // If it's a balance, set the stock to the quantity
              newStock = data.quantity;
            }
            
            // Update product stock
            products[productIndex].stock = newStock;
            products[productIndex].updatedAt = new Date();
            
            // Save updated products to storage
            storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
            
            // Record stock history if needed
            const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
            stockHistory.push({
              id: crypto.randomUUID(),
              productId: data.productId,
              productName: product.name,
              timestamp: new Date(),
              previousStock: previousStock,
              newStock: newStock,
              quantity: data.quantity,
              adjustmentType: data.adjustmentType || 'add',
              reason: data.reason,
              userName: 'Current User', // This should be replaced with the actual user
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
          const filteredHistory = productId 
            ? stockHistory.filter(item => item.productId === productId)
            : stockHistory;
            
          // Sort by timestamp, most recent first
          filteredHistory.sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return dateB - dateA;
          });
          
          // Ensure all timestamps are valid date strings
          const validatedHistory = filteredHistory.map(item => ({
            ...item,
            timestamp: item.timestamp || new Date().toISOString(),
          }));
          
          resolve(validatedHistory);
        }, 300);
      });
    },
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
