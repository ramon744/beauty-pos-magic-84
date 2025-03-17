
import { useQuery } from '@tanstack/react-query';
import { Product, Category } from '@/types';

// Mock data (temporary) - in a real app, you would fetch this from an API
const MOCK_PRODUCTS: Product[] = [
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

// Function to fetch products (mock implementation)
const fetchProducts = async (): Promise<Product[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_PRODUCTS);
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
          const product = MOCK_PRODUCTS.find(p => p.id === productId);
          resolve(product);
        }, 300);
      });
    },
    enabled: !!productId,
  });
};

// Mock categories data
const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics' },
  { id: '2', name: 'Clothing' },
  { id: '3', name: 'Food & Beverages' }
];

// Hook to fetch categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Simulate API call
      return new Promise<Category[]>((resolve) => {
        setTimeout(() => {
          resolve(MOCK_CATEGORIES);
        }, 300);
      });
    },
  });
};

// Mocked save product function
export const useSaveProduct = () => {
  return {
    mutate: (product: Product, options: any) => {
      setTimeout(() => {
        console.log('Saving product:', product);
        options.onSuccess?.();
      }, 500);
    },
    isPending: false
  };
};

// Mocked delete product function
export const useDeleteProduct = () => {
  return {
    mutate: (productId: string, options: any) => {
      setTimeout(() => {
        console.log('Deleting product:', productId);
        options.onSuccess?.();
      }, 500);
    },
    isPending: false
  };
};

// Mock function for stock adjustment
export const useStockAdjustment = () => {
  return {
    mutate: (data: { productId: string, quantity: number, reason: string }, options: any) => {
      setTimeout(() => {
        console.log('Adjusting stock:', data);
        options.onSuccess?.();
      }, 500);
    },
    isPending: false
  };
};

// Mock function for stock history
export const useStockHistory = (productId: string) => {
  return useQuery({
    queryKey: ['stockHistory', productId],
    queryFn: async () => {
      return new Promise<any[]>((resolve) => {
        setTimeout(() => {
          resolve([
            { id: '1', date: new Date(), quantity: 5, type: 'increase', reason: 'Initial stock' }
          ]);
        }, 300);
      });
    },
    enabled: !!productId,
  });
};

// Mock statistics data
export const useStatistics = () => {
  return useQuery({
    queryKey: ['productStats'],
    queryFn: async () => {
      return new Promise<any>(resolve => {
        setTimeout(() => {
          resolve({
            lowStock: 2,
            outOfStock: 1,
            totalProducts: MOCK_PRODUCTS.length,
            productsByCategory: [
              { category: 'Electronics', count: 3 }
            ]
          });
        }, 300);
      });
    }
  });
};
