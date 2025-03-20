
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { supabase } from '@/integrations/supabase/client';

// Get products from storage or Supabase
const getProductsFromStorage = async (): Promise<Product[]> => {
  try {
    // Try to fetch from Supabase first
    const { data: supabaseProducts, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.error('Error fetching products from Supabase:', error);
      throw error;
    }

    if (supabaseProducts && supabaseProducts.length > 0) {
      // Map Supabase data to our Product type
      return supabaseProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        code: p.code,
        category: { 
          id: p.category_id, 
          name: p.category_name 
        },
        salePrice: Number(p.sale_price),
        costPrice: Number(p.cost_price),
        stock: p.stock,
        minimumStock: p.minimum_stock,
        image: p.image,
        supplierIds: p.supplier_ids,
        expirationDate: p.expiration_date ? new Date(p.expiration_date) : null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      }));
    }
    
    // Fall back to localStorage if Supabase returns no data
    const storedProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
    if (storedProducts && storedProducts.length > 0) {
      return storedProducts;
    }
  } catch (err) {
    console.error('Error in getProductsFromStorage:', err);
    
    // Fall back to localStorage if Supabase fails
    const storedProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
    if (storedProducts && storedProducts.length > 0) {
      return storedProducts;
    }
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
  
  // Also save to Supabase if possible
  try {
    for (const product of mockProducts) {
      await supabase.from('products').insert({
        id: product.id,
        name: product.name,
        description: product.description,
        code: product.code,
        category_id: product.category.id,
        category_name: product.category.name,
        sale_price: product.salePrice,
        cost_price: product.costPrice,
        stock: product.stock,
        minimum_stock: product.minimumStock,
        image: product.image,
        expiration_date: product.expirationDate,
        created_at: product.createdAt,
        updated_at: product.updatedAt
      });
    }
  } catch (err) {
    console.error('Error saving mock products to Supabase:', err);
  }
  
  return mockProducts;
};

// Function to fetch products
const fetchProducts = async (): Promise<Product[]> => {
  // Simulate API call delay
  return new Promise((resolve) => {
    setTimeout(async () => {
      const products = await getProductsFromStorage();
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
      if (!productId) return undefined;
      
      try {
        // Try to fetch from Supabase first
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (error) {
          console.error('Error fetching product from Supabase:', error);
          throw error;
        }
        
        if (data) {
          return {
            id: data.id,
            name: data.name,
            description: data.description || '',
            code: data.code,
            category: { 
              id: data.category_id, 
              name: data.category_name 
            },
            salePrice: Number(data.sale_price),
            costPrice: Number(data.cost_price),
            stock: data.stock,
            minimumStock: data.minimum_stock,
            image: data.image,
            supplierIds: data.supplier_ids,
            expirationDate: data.expiration_date ? new Date(data.expiration_date) : null,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        }
      } catch (err) {
        console.error('Error in useFetchProduct:', err);
      }
      
      // Fall back to localStorage if Supabase fails
      return new Promise<Product | undefined>((resolve) => {
        setTimeout(() => {
          const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
          const product = products.find(p => p.id === productId);
          resolve(product);
        }, 300);
      });
    },
    enabled: !!productId,
  });
};

// Get categories from Supabase or localStorage
const getCategoriesFromStorage = async (): Promise<Category[]> => {
  try {
    // Try to fetch from Supabase first
    const { data: supabaseCategories, error } = await supabase
      .from('categories')
      .select('*');
    
    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      throw error;
    }

    if (supabaseCategories && supabaseCategories.length > 0) {
      // Map Supabase data to our Category type
      return supabaseCategories.map(c => ({
        id: c.id,
        name: c.name
      }));
    }
    
    // Fall back to localStorage if Supabase returns no data
    const storedCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES);
    if (storedCategories && storedCategories.length > 0) {
      return storedCategories;
    }
  } catch (err) {
    console.error('Error in getCategoriesFromStorage:', err);
    
    // Fall back to localStorage if Supabase fails
    const storedCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES);
    if (storedCategories && storedCategories.length > 0) {
      return storedCategories;
    }
  }
  
  // If no categories in storage, use mock data
  const mockCategories: Category[] = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Food & Beverages' }
  ];
  
  // Initialize storage with mock data
  storageService.setItem(STORAGE_KEYS.CATEGORIES, mockCategories);
  
  // Also save to Supabase if possible
  try {
    for (const category of mockCategories) {
      await supabase.from('categories').insert({
        id: category.id,
        name: category.name
      });
    }
  } catch (err) {
    console.error('Error saving mock categories to Supabase:', err);
  }
  
  return mockCategories;
};

// Hook to fetch categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return await getCategoriesFromStorage();
    },
  });
};

// Improved save product function that updates both Supabase and localStorage
export const useSaveProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Product) => {
      console.log('Saving product to Supabase:', product);
      
      try {
        // Prepare data for Supabase
        const supabaseProduct = {
          id: product.id,
          name: product.name,
          description: product.description,
          code: product.code,
          category_id: product.category.id,
          category_name: product.category.name,
          sale_price: product.salePrice,
          cost_price: product.costPrice,
          stock: product.stock,
          minimum_stock: product.minimumStock,
          image: product.image,
          supplier_ids: product.supplierIds,
          expiration_date: product.expirationDate,
          updated_at: new Date()
        };
        
        // Check if product exists
        const { data: existingProduct, error: fetchError } = await supabase
          .from('products')
          .select('id')
          .eq('id', product.id)
          .maybeSingle();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking if product exists:', fetchError);
          throw fetchError;
        }
        
        let result;
        if (existingProduct) {
          // Update existing product
          result = await supabase
            .from('products')
            .update(supabaseProduct)
            .eq('id', product.id);
        } else {
          // Create new product
          result = await supabase
            .from('products')
            .insert(supabaseProduct);
        }
        
        if (result.error) {
          console.error('Error saving product to Supabase:', result.error);
          throw result.error;
        }
        
        // Also update localStorage for fallback
        const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const existingProductIndex = products.findIndex(p => p.id === product.id);
        
        if (existingProductIndex >= 0) {
          products[existingProductIndex] = product;
        } else {
          products.push(product);
        }
        
        storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
        
        return product;
      } catch (err) {
        console.error('Error in useSaveProduct:', err);
        
        // Fall back to localStorage only if Supabase fails
        const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const existingProductIndex = products.findIndex(p => p.id === product.id);
        
        if (existingProductIndex >= 0) {
          products[existingProductIndex] = product;
        } else {
          products.push(product);
        }
        
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
