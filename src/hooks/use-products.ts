
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, Category } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { toast } from '@/hooks/use-toast';

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
    // Buscar do Supabase
    const products = await storageService.getFromSupabase<Product>('products');
    
    // Atualizar localStorage para compatibilidade
    if (products && products.length > 0) {
      storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
    }
    
    // Filter out deleted products
    const deletedIds = getDeletedProductIds();
    return products.filter(p => !deletedIds.includes(p.id));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    
    // Caso de erro, tentar usar dados locais como fallback
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
        
        // Tentar usar dados locais como fallback
        const products = getProductsFromStorage();
        return products.find(p => p.id === productId);
      }
      
      try {
        // Buscar do Supabase
        const products = await storageService.getFromSupabase<Product>('products', 'id', productId);
        if (products && products.length > 0) {
          return products[0];
        }
        
        throw new Error('Produto não encontrado');
      } catch (error) {
        console.error(`Erro ao buscar produto ${productId}:`, error);
        
        // Tentar usar dados locais como fallback
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
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível buscar as categorias. O aplicativo precisa de conexão com a internet."
        });
        
        // Tentar usar dados locais como fallback
        return getCategoriesFromStorage();
      }
      
      try {
        // Buscar do Supabase
        const categories = await storageService.getFromSupabase<Category>('categories');
        
        // Atualizar localStorage para compatibilidade
        if (categories && categories.length > 0) {
          storageService.setItem(STORAGE_KEYS.CATEGORIES, categories);
          return categories;
        }
        
        throw new Error('Nenhuma categoria encontrada');
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        
        // Tentar usar dados locais como fallback
        return getCategoriesFromStorage();
      }
    },
  });
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
        // Salvar no Supabase
        const savedProduct = await storageService.saveToSupabase('products', product);
        
        // Atualizar localStorage para compatibilidade
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
        // 1. Buscar detalhes do produto
        const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const productToDelete = products.find(p => p.id === productId);
        
        if (!productToDelete) {
          console.warn(`Product ${productId} not found in localStorage, proceeding with deletion anyway`);
        } else {
          console.log(`Found product to delete: ${productToDelete.name}`);
        }
        
        // 2. Apagar do histórico de estoque primeiro
        try {
          console.log(`Attempting to delete related stock history for product ${productId}`);
          const stockHistoryItems = await storageService.getFromSupabase<any>('stock_history', 'product_id', productId);
          
          if (stockHistoryItems && stockHistoryItems.length > 0) {
            console.log(`Found ${stockHistoryItems.length} stock history items to delete`);
            for (const item of stockHistoryItems) {
              await storageService.removeFromSupabase('stock_history', item.id);
            }
          }
          
          // Atualizar localStorage para compatibilidade
          const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
          const updatedStockHistory = stockHistory.filter(item => item.productId !== productId);
          storageService.setItem(STORAGE_KEYS.STOCKS, updatedStockHistory);
        } catch (error) {
          console.error('Error deleting related stock history:', error);
        }
        
        // 3. Apagar produto do Supabase
        console.log(`Deleting product ${productId} from Supabase`);
        await storageService.removeFromSupabase('products', productId);
        
        // 4. Atualizar localStorage para compatibilidade
        const updatedProducts = products.filter(p => p.id !== productId);
        storageService.setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
        
        // 5. Registrar ID excluído para persistência
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
        
        // Mesmo com erro, registrar como excluído localmente
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
      // Invalidate queries to refetch data for ALL related components
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
        // Buscar produto do Supabase
        const products = await storageService.getFromSupabase<Product>('products', 'id', data.productId);
        
        if (!products || products.length === 0) {
          throw new Error('Produto não encontrado');
        }
        
        const product = products[0];
        const previousStock = product.stock;
        let newStock = previousStock;
        
        // Calcular novo estoque baseado no tipo de ajuste
        if (data.adjustmentType === 'balance') {
          newStock = data.quantity;
        } else if (data.adjustmentType === 'remove') {
          newStock = previousStock - data.quantity;
        } else if (data.adjustmentType === 'add') {
          newStock = previousStock + data.quantity;
        }
        
        // Atualizar produto no Supabase
        product.stock = newStock;
        product.updatedAt = new Date();
        
        await storageService.saveToSupabase('products', product);
        
        // Atualizar localStorage para compatibilidade
        const localProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const productIndex = localProducts.findIndex(p => p.id === data.productId);
        
        if (productIndex >= 0) {
          localProducts[productIndex].stock = newStock;
          localProducts[productIndex].updatedAt = new Date();
          storageService.setItem(STORAGE_KEYS.PRODUCTS, localProducts);
        }
        
        // Registrar histórico de estoque
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
        
        // Salvar histórico no Supabase
        await storageService.saveToSupabase('stock_history', historyEntry);
        
        // Atualizar localStorage para compatibilidade
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
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível buscar o histórico de estoque. O aplicativo precisa de conexão com a internet."
        });
        
        // Tentar usar dados locais como fallback
        const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
        const deletedIds = getDeletedProductIds();
        
        // Filtrar itens excluídos e ordenar por data
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
        // Buscar histórico de estoque do Supabase
        let stockHistory;
        
        if (productId) {
          stockHistory = await storageService.getFromSupabase<any>('stock_history', 'product_id', productId);
        } else {
          stockHistory = await storageService.getFromSupabase<any>('stock_history');
        }
        
        // Atualizar localStorage para compatibilidade
        if (stockHistory && stockHistory.length > 0) {
          storageService.setItem(STORAGE_KEYS.STOCKS, stockHistory);
        }
        
        // Ordenar por data
        stockHistory.sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          return dateB - dateA;
        });
        
        // Filtrar produtos excluídos
        const deletedIds = getDeletedProductIds();
        return stockHistory.filter(item => !deletedIds.includes(item.productId));
      } catch (error) {
        console.error('Erro ao buscar histórico de estoque:', error);
        
        // Tentar usar dados locais como fallback
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
        // Se não temos dados de produtos ou categorias, podemos usar dados locais
        const localProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        const localCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
        const deletedIds = getDeletedProductIds();
        
        // Filtrar produtos excluídos
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
    enabled: true,
  });
};
