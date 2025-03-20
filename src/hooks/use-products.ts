import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService, STORAGE_KEYS, fromSupabase } from '@/services/storage-service';
import { toast } from '@/hooks/use-toast';

// Get products from storage or use mock data if not available
const getProductsFromStorage = (): Product[] => {
  const storedProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS);
  if (storedProducts && storedProducts.length > 0) {
    return storedProducts;
  }
  
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
  
  storageService.setItem(STORAGE_KEYS.PRODUCTS, mockProducts);
  return mockProducts;
};

// Get list of deleted product IDs from localStorage
const getDeletedProductIds = (): string[] => {
  return JSON.parse(localStorage.getItem('deletedProductIds') || '[]');
};

// Function to fetch products from storage, filtering out deleted products
const fetchProducts = async (): Promise<Product[]> => {
  if (!navigator.onLine) {
    toast({
      variant: "destructive",
      title: "Erro de conexão",
      description: "Não foi possível buscar os produtos. O aplicativo precisa de conexão com a internet."
    });
    throw new Error('Aplicativo está offline. Não é possível buscar produtos.');
  }
  
  try {
    const products = await storageService.getFromSupabase<Product>('products');
    
    if (products && products.length > 0) {
      storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
    }
    
    const deletedIds = getDeletedProductIds();
    return products.filter(p => !deletedIds.includes(p.id));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    
    const allProducts = getProductsFromStorage();
    const deletedIds = getDeletedProductIds();
    return allProducts.filter(p => !deletedIds.includes(p.id));
  }
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
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível buscar os detalhes do produto. O aplicativo precisa de conexão com a internet."
        });
        
        const products = getProductsFromStorage();
        return products.find(p => p.id === productId);
      }
      
      try {
        const products = await storageService.getFromSupabase<Product>('products', 'id', productId);
        if (products && products.length > 0) {
          return products[0];
        }
        
        throw new Error('Produto não encontrado');
      } catch (error) {
        console.error(`Erro ao buscar produto ${productId}:`, error);
        
        const products = getProductsFromStorage();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
          throw new Error('Produto não encontrado');
        }
        
        return product;
      }
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
  
  const mockCategories: Category[] = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Clothing' },
    { id: '3', name: 'Food & Beverages' }
  ];
  
  storageService.setItem(STORAGE_KEYS.CATEGORIES, mockCategories);
  return mockCategories;
};

// Hook to fetch categories
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível buscar as categorias. O aplicativo precisa de conexão com a internet."
        });
        
        return getCategoriesFromStorage();
      }
      
      try {
        const categories = await storageService.getFromSupabase<Category>('categories');
        
        if (categories && categories.length > 0) {
          storageService.setItem(STORAGE_KEYS.CATEGORIES, categories);
          return categories;
        }
        
        throw new Error('Nenhuma categoria encontrada');
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        
        return getCategoriesFromStorage();
      }
    },
  });
};

// Função auxiliar para mapear um objeto Product para o formato aceito pelo Supabase
const mapProductToSupabase = (product: Product) => {
  return {
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
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
};

// Função auxiliar para mapear dados do Supabase para o formato Product
const mapSupabaseToProduct = (data: any): Product => {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    code: data.code,
    category: {
      id: data.category_id,
      name: data.category_name
    },
    salePrice: data.sale_price,
    costPrice: data.cost_price,
    stock: data.stock,
    minimumStock: data.minimum_stock,
    image: data.image,
    supplierIds: data.supplier_ids,
    expirationDate: data.expiration_date ? new Date(data.expiration_date) : null,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
};

// Improved save product function that updates localStorage and Supabase
export const useSaveProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível salvar o produto. O aplicativo precisa de conexão com a internet."
        });
        throw new Error('Aplicativo está offline. Não é possível salvar o produto.');
      }
      
      console.log('Saving product:', product);
      
      try {
        const supabaseProduct = mapProductToSupabase(product);
        
        const { data, error } = await fromSupabase('products')
          .upsert(supabaseProduct)
          .select();
        
        if (error) {
          console.error('Error saving to products:', error);
          throw error;
        }
        
        const savedProduct = data && data.length > 0 
          ? mapSupabaseToProduct(data[0]) 
          : product;
        
        const products = getProductsFromStorage();
        const existingProductIndex = products.findIndex(p => p.id === product.id);
        
        if (existingProductIndex >= 0) {
          products[existingProductIndex] = savedProduct;
        } else {
          products.push(savedProduct);
        }
        
        storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
        
        return savedProduct;
      } catch (error) {
        console.error('Erro ao salvar produto:', error);
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: "Não foi possível salvar o produto. Tente novamente."
        });
        throw error;
      }
    },
    onSuccess: () => {
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
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível excluir o produto. O aplicativo precisa de conexão com a internet."
        });
        throw new Error('Aplicativo está offline. Não é possível excluir o produto.');
      }
      
      console.log('Deleting product:', productId);
      
      try {
        const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const productToDelete = products.find(p => p.id === productId);
        
        if (!productToDelete) {
          console.warn(`Product ${productId} not found in localStorage, proceeding with deletion anyway`);
        } else {
          console.log(`Found product to delete: ${productToDelete.name}`);
        }
        
        try {
          console.log(`Attempting to delete related stock history for product ${productId}`);
          const stockHistoryItems = await storageService.getFromSupabase<any>('stock_history', 'product_id', productId);
          
          if (stockHistoryItems && stockHistoryItems.length > 0) {
            console.log(`Found ${stockHistoryItems.length} stock history items to delete`);
            for (const item of stockHistoryItems) {
              await storageService.removeFromSupabase('stock_history', item.id);
            }
          }
          
          const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
          const updatedStockHistory = stockHistory.filter(item => item.productId !== productId);
          storageService.setItem(STORAGE_KEYS.STOCKS, updatedStockHistory);
        } catch (error) {
          console.error('Error deleting related stock history:', error);
        }
        
        console.log(`Deleting product ${productId} from Supabase`);
        await storageService.removeFromSupabase('products', productId);
        
        const updatedProducts = products.filter(p => p.id !== productId);
        storageService.setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
        
        const deletedIds = getDeletedProductIds();
        if (!deletedIds.includes(productId)) {
          deletedIds.push(productId);
          localStorage.setItem('deletedProductIds', JSON.stringify(deletedIds));
        }
        
        return productId;
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível excluir o produto. Tente novamente."
        });
        
        const deletedIds = getDeletedProductIds();
        if (!deletedIds.includes(productId)) {
          deletedIds.push(productId);
          localStorage.setItem('deletedProductIds', JSON.stringify(deletedIds));
        }
        
        throw error;
      }
    },
    onSuccess: (productId) => {
      console.log(`Product ${productId} successfully deleted`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productStats'] });
      queryClient.invalidateQueries({ queryKey: ['stockHistory'] });
    }
  });
};

// Improved stock adjustment function that updates Supabase and localStorage
export const useStockAdjustment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { productId: string, quantity: number, reason: string, adjustmentType?: 'add' | 'remove' | 'balance' }) => {
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível ajustar o estoque. O aplicativo precisa de conexão com a internet."
        });
        throw new Error('Aplicativo está offline. Não é possível ajustar o estoque.');
      }
      
      console.log('Adjusting stock:', data);
      
      try {
        const products = await storageService.getFromSupabase<Product>('products', 'id', data.productId);
        
        if (!products || products.length === 0) {
          throw new Error('Produto não encontrado');
        }
        
        const product = products[0];
        const previousStock = product.stock;
        let newStock = previousStock;
        
        if (data.adjustmentType === 'balance') {
          newStock = data.quantity;
        } else if (data.adjustmentType === 'remove') {
          newStock = previousStock - data.quantity;
        } else if (data.adjustmentType === 'add') {
          newStock = previousStock + data.quantity;
        }
        
        product.stock = newStock;
        product.updatedAt = new Date();
        
        await storageService.saveToSupabase('products', product);
        
        const localProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const productIndex = localProducts.findIndex(p => p.id === data.productId);
        
        if (productIndex >= 0) {
          localProducts[productIndex].stock = newStock;
          localProducts[productIndex].updatedAt = new Date();
          storageService.setItem(STORAGE_KEYS.PRODUCTS, localProducts);
        }
        
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
          userName: 'Current User',
        };
        
        await storageService.saveToSupabase('stock_history', historyEntry);
        
        const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
        stockHistory.push(historyEntry);
        storageService.setItem(STORAGE_KEYS.STOCKS, stockHistory);
        
        return data;
      } catch (error) {
        console.error('Erro ao ajustar estoque:', error);
        toast({
          variant: "destructive",
          title: "Erro ao ajustar estoque",
          description: "Não foi possível ajustar o estoque do produto. Tente novamente."
        });
        throw error;
      }
    },
    onSuccess: () => {
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
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível buscar o histórico de estoque. O aplicativo precisa de conexão com a internet."
        });
        
        const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
        const deletedIds = getDeletedProductIds();
        
        const filteredByDeletion = stockHistory.filter(item => !deletedIds.includes(item.productId));
        const filteredHistory = productId 
          ? filteredByDeletion.filter(item => item.productId === productId)
          : filteredByDeletion;
        
        filteredHistory.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
        
        return filteredHistory;
      }
      
      try {
        let stockHistory;
        
        if (productId) {
          stockHistory = await storageService.getFromSupabase<any>('stock_history', 'product_id', productId);
        } else {
          stockHistory = await storageService.getFromSupabase<any>('stock_history');
        }
        
        if (stockHistory && stockHistory.length > 0) {
          storageService.setItem(STORAGE_KEYS.STOCKS, stockHistory);
        }
        
        stockHistory.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
        
        const deletedIds = getDeletedProductIds();
        return stockHistory.filter(item => !deletedIds.includes(item.productId));
      } catch (error) {
        console.error('Erro ao buscar histórico de estoque:', error);
        
        const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
        const deletedIds = getDeletedProductIds();
        
        const filteredByDeletion = stockHistory.filter(item => !deletedIds.includes(item.productId));
        const filteredHistory = productId 
          ? filteredByDeletion.filter(item => item.productId === productId)
          : filteredByDeletion;
        
        filteredHistory.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
        
        return filteredHistory;
      }
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
      if (!products || !categories) {
        const localProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const localCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
        const deletedIds = getDeletedProductIds();
        
        const availableProducts = localProducts.filter(p => !deletedIds.includes(p.id));
        
        return {
          totalProducts: availableProducts.length,
          stockValue: availableProducts.reduce((total, product) => total + (product.stock * product.costPrice), 0) || 0,
          outOfStock: availableProducts.filter(product => product.stock === 0).length || 0,
          categories: localCategories.length || 0,
          lowStock: availableProducts.filter(product => 
            product.minimumStock !== undefined && 
            product.stock > 0 && 
            product.stock <= product.minimumStock
          ).length || 0,
        };
      }
      
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
    enabled: true,
  });
};
