
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types';

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

// Custom hook that uses useFetchProducts but with a simpler name
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
};

// Original hook with more explicit name for consistency with other hooks
export const useFetchProducts = useProducts;
