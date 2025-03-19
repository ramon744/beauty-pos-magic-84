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
  try {
    // First try to fetch from Supabase
    const products = await storageService.getFromSupabase<Product>('products');
    if (products && products.length > 0) {
      // Update local storage with latest data from Supabase
      storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
      return products;
    }
  } catch (error) {
    console.error('Error fetching from Supabase, falling back to localStorage:', error);
  }
  
  // If Supabase fails or returns no data, get from local storage
  return getProductsFromStorage();
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
      try {
        // Try to fetch from Supabase first
        const products = await storageService.getFromSupabase<Product>('products', 'id', productId);
        if (products && products.length > 0) {
          return products[0];
        }
      } catch (error) {
        console.error('Error fetching product from Supabase, falling back to localStorage:', error);
      }
      
      // Fallback to local storage
      const products = getProductsFromStorage();
      return products.find(p => p.id === productId);
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
      try {
        // Try to fetch from Supabase first
        const categories = await storageService.getFromSupabase<Category>('categories');
        if (categories && categories && categories.length > 0) {
          // Update local storage with latest data
          storageService.setItem(STORAGE_KEYS.CATEGORIES, categories);
          return categories;
        }
      } catch (error) {
        console.error('Error fetching categories from Supabase, falling back to localStorage:', error);
      }
      
      // Fallback to local storage
      return getCategoriesFromStorage();
    },
  });
};

// Improved save product function that updates localStorage and Supabase
export const useSaveProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Product) => {
      console.log('Saving product:', product);
      
      try {
        // First try to save to Supabase
        const savedProduct = await storageService.saveToSupabase('products', product);
        return savedProduct;
      } catch (error) {
        console.error('Failed to save to Supabase, saving to localStorage only:', error);
        
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
        
        return product;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['productStats'] });
    }
  });
};

// Improved delete product function that updates Supabase and localStorage
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (productId: string) => {
      console.log('Deleting product:', productId);
      
      try {
        // 1. Get the product details first (for cleanup of related records)
        const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const productToDelete = products.find(p => p.id === productId);
        
        if (!productToDelete) {
          console.warn(`Product ${productId} not found in localStorage, proceeding with deletion anyway`);
        } else {
          console.log(`Found product to delete: ${productToDelete.name}`);
        }
        
        // 2. Delete from stock history first (if related records exist)
        try {
          console.log(`Attempting to delete related stock history for product ${productId}`);
          await storageService.removeFromSupabase('stock_history', 'product_id', productId);
          
          // Also remove from localStorage
          const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
          const updatedStockHistory = stockHistory.filter(item => item.productId !== productId);
          storageService.setItem(STORAGE_KEYS.STOCKS, updatedStockHistory);
        } catch (error) {
          console.error('Error deleting related stock history:', error);
          // Continue with product deletion even if stock history deletion fails
        }
        
        // 3. Delete the product from Supabase
        console.log(`Deleting product ${productId} from Supabase`);
        await storageService.removeFromSupabase('products', productId);
        
        // 4. Get current products from localStorage before deletion (final verification)
        const products1 = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        console.log(`Before final verification: ${products1.length} products in localStorage`);
        console.log(`Products still has deleted item: ${products1.some(p => p.id === productId)}`);
        
        // 5. Filter out the product to delete one more time
        const updatedProducts = products1.filter(p => p.id !== productId);
        console.log(`After final verification: ${updatedProducts.length} products should be in localStorage`);
        
        // 6. Force save the updated products to localStorage
        storageService.setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
        
        // 7. Double check deletion was successful
        const afterDelete = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        if (afterDelete.some(p => p.id === productId)) {
          console.error('Product still exists in localStorage after deletion, forcing removal');
          const forceRemove = afterDelete.filter(p => p.id !== productId);
          storageService.setItem(STORAGE_KEYS.PRODUCTS, forceRemove);
        }
        
        return productId;
      } catch (error) {
        console.error('Error in product deletion process:', error);
        
        // Even if there was an error, make sure the product is removed from localStorage
        const finalCheck = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        if (finalCheck.some(p => p.id === productId)) {
          console.error('Despite errors, ensuring product is removed from localStorage');
          const finalRemove = finalCheck.filter(p => p.id !== productId);
          storageService.setItem(STORAGE_KEYS.PRODUCTS, finalRemove);
        }
        
        return productId;
      }
    },
    onSuccess: (productId) => {
      console.log(`Product ${productId} successfully deleted`);
      // Invalidate queries to refetch data for ALL related components
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productStats'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
      
      // Perform one final check to ensure the product is truly gone
      setTimeout(() => {
        const finalCheck = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        if (finalCheck.some(p => p.id === productId)) {
          console.error('Product still exists in localStorage after all deletion attempts');
          const finalRemove = finalCheck.filter(p => p.id !== productId);
          storageService.setItem(STORAGE_KEYS.PRODUCTS, finalRemove);
          // Force a re-query 
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      }, 500);
    }
  });
};

// Improved stock adjustment function that updates Supabase and localStorage
export const useStockAdjustment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { productId: string, quantity: number, reason: string, adjustmentType?: 'add' | 'remove' | 'balance' }) => {
      console.log('Adjusting stock:', data);
      
      // Get current products from storage
      const products = getProductsFromStorage();
      
      // Find the product to adjust
      const productIndex = products.findIndex(p => p.id === data.productId);
      
      if (productIndex < 0) {
        throw new Error('Product not found');
      }
      
      const product = products[productIndex];
      const previousStock = product.stock;
      let newStock = previousStock;
      
      // For balance adjustment, simply set the stock to exactly what was entered
      if (data.adjustmentType === 'balance') {
        // Set the stock directly to the exact value entered by the user
        newStock = data.quantity;
      } else if (data.adjustmentType === 'remove') {
        // If it's a removal, subtract the quantity
        newStock = previousStock - data.quantity;
      } else if (data.adjustmentType === 'add') {
        // If it's an addition, add the quantity
        newStock = previousStock + data.quantity;
      }
      
      // Update product stock locally
      products[productIndex].stock = newStock;
      products[productIndex].updatedAt = new Date();
      
      // Save updated products to local storage
      storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
      
      // Record stock history
      const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
      const historyEntry = {
        id: crypto.randomUUID(),
        productId: data.productId,
        productName: product.name,
        timestamp: new Date(),
        previousStock: previousStock,
        newStock: newStock,
        quantity: data.adjustmentType === 'balance' ? Math.abs(newStock - previousStock) : data.quantity,
        adjustmentType: data.adjustmentType || 'add',
        reason: data.reason,
        userName: 'Current User', // This should be replaced with the actual user
      };
      
      stockHistory.push(historyEntry);
      storageService.setItem(STORAGE_KEYS.STOCKS, stockHistory);
      
      try {
        // Try to save the updated product to Supabase
        await storageService.saveToSupabase('products', products[productIndex]);
        
        // Try to save the stock history entry to Supabase
        await storageService.saveToSupabase('stock_history', historyEntry);
      } catch (error) {
        console.error('Failed to sync stock adjustment to Supabase, stored in localStorage only:', error);
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
      queryClient.invalidateQueries({ queryKey: ['productStats'] });
    }
  });
};

// Updated stock history function to use Supabase and localStorage
export const useStockHistory = (productId: string) => {
  return useQuery({
    queryKey: ['stockHistory', productId],
    queryFn: async () => {
      try {
        // Try to fetch from Supabase first
        let stockHistory;
        
        if (productId) {
          // If productId is provided, filter by product_id
          stockHistory = await storageService.getFromSupabase<any>('stock_history', 'product_id', productId);
        } else {
          // If no productId, get all stock history
          stockHistory = await storageService.getFromSupabase<any>('stock_history');
        }
        
        if (stockHistory && stockHistory.length > 0) {
          // Update local storage with the latest data
          storageService.setItem(STORAGE_KEYS.STOCKS, stockHistory);
          
          // Sort by timestamp, most recent first
          stockHistory.sort((a, b) => {
            // Fix: Access timestamp property from individual items, not from the array
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return dateB - dateA;
          });
          
          return stockHistory;
        }
      } catch (error) {
        console.error('Error fetching stock history from Supabase, falling back to localStorage:', error);
      }
      
      // Fallback to localStorage
      const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
      const filteredHistory = productId 
        ? stockHistory.filter(item => item.productId === productId)
        : stockHistory;
      
      // Sort by timestamp, most recent first
      filteredHistory.sort((a, b) => {
        // Fix: Access timestamp property from individual items, not from the array
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
      
      return filteredHistory;
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
