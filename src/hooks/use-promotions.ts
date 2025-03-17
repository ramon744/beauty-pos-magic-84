import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Promotion } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

// Types for promotion statistics
interface PromotionStatistics {
  totalPromotions: number;
  activePromotions: number;
  upcomingPromotions: number;
  expiredPromotions: number;
}

// Initial mock data for promotions
const initialPromotions: Promotion[] = [
  {
    id: '1',
    name: 'Promoção Inverno',
    type: 'discount_percentage',
    description: 'Desconto de 20% em todos os produtos da categoria Tratamentos',
    discountPercent: 20,
    categoryId: '4', // Tratamentos category
    startDate: new Date(2023, 5, 1), // June 1st
    endDate: new Date(2023, 7, 31), // August 31st
    isActive: true,
    createdBy: '1', // Admin
    createdAt: new Date(2023, 4, 15), // May 15th
  },
  {
    id: '2',
    name: 'Compre 2 Leve 3',
    type: 'buy_x_get_y',
    description: 'Compre 2 produtos da linha de shampoos e leve 3',
    buyQuantity: 2,
    getQuantity: 1,
    productId: '1', // Shampoo product
    secondaryProductDiscount: 100, // 100% discount (free)
    startDate: new Date(2023, 6, 1), // July 1st
    endDate: new Date(2023, 8, 30), // September 30th
    isActive: true,
    createdBy: '1', // Admin
    createdAt: new Date(2023, 5, 20), // June 20th
  },
  {
    id: '3',
    name: 'Preço Fixo Coloração',
    type: 'fixed_price',
    description: 'Preço fixo de R$39,90 na coloração permanente',
    fixedPrice: 39.90,
    productId: '3', // Coloração product
    startDate: new Date(2023, 6, 15), // July 15th
    endDate: new Date(2023, 7, 15), // August 15th
    isActive: false,
    createdBy: '1', // Admin
    createdAt: new Date(2023, 6, 10), // July 10th
  },
  {
    id: '4',
    name: 'Compre 1 Condicionador Leve 1 Máscara com 50% OFF',
    type: 'buy_x_get_y',
    description: 'Compre 1 condicionador e leve 1 máscara capilar com 50% de desconto',
    buyQuantity: 1,
    getQuantity: 1,
    productId: '2', // Condicionador product
    secondaryProductId: '5', // Máscara capilar product
    secondaryProductDiscount: 50, // 50% discount
    startDate: new Date(2023, 5, 15), // June 15th
    endDate: new Date(2023, 8, 15), // September 15th
    isActive: true,
    createdBy: '1', // Admin
    createdAt: new Date(2023, 5, 10), // June 10th
  },
  {
    id: '5',
    name: 'Produtos para Finalização em Oferta',
    type: 'discount_percentage',
    description: 'Desconto de 15% em produtos selecionados para finalização',
    discountPercent: 15,
    productIds: ['6', '7', '8'], // Produtos de finalização
    startDate: new Date(2023, 6, 1), // July 1st
    endDate: new Date(2023, 9, 30), // October 30th
    isActive: true,
    createdBy: '1', // Admin
    createdAt: new Date(2023, 5, 25), // June 25th
  },
];

// Initialize data in localStorage if it doesn't exist
const initializeData = () => {
  storageService.setItem(STORAGE_KEYS.PROMOTIONS, initialPromotions);
  
  // Calculate and update statistics
  updateStatistics();
};

// Helper function to calculate statistics
const updateStatistics = (): PromotionStatistics => {
  const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
  
  const now = new Date();
  
  const statistics: PromotionStatistics = {
    totalPromotions: promotions.length,
    activePromotions: promotions.filter(p => p.isActive).length,
    upcomingPromotions: promotions.filter(p => {
      return p.isActive && new Date(p.startDate) > now;
    }).length,
    expiredPromotions: promotions.filter(p => {
      return new Date(p.endDate) < now;
    }).length,
  };
  
  storageService.setItem(STORAGE_KEYS.PROMOTIONS_STATISTICS, statistics);
  return statistics;
};

// Initialize data with a check to avoid duplicating entries
const initializeIfNeeded = () => {
  const existingPromotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS);
  if (!existingPromotions || existingPromotions.length === 0) {
    initializeData();
    console.log("Initialized promotion data in localStorage");
  }
};

// Run initialization
initializeIfNeeded();

// Hook for fetching all promotions
export function useFetchPromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      // Ensure data is initialized if empty
      const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS);
      if (!promotions || promotions.length === 0) {
        initializeData();
        console.log("Re-initialized promotion data during fetch");
      }
      
      // Fetch from localStorage
      return storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
    },
  });
}

// Hook for fetching a single promotion
export function useFetchPromotion(id: string) {
  return useQuery({
    queryKey: ['promotion', id],
    queryFn: async () => {
      // Skip the request if id is empty
      if (!id) return null;
      
      // Fetch from localStorage
      const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
      const promotion = promotions.find(p => p.id === id);
      if (!promotion) throw new Error('Promotion not found');
      
      return promotion;
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

// Hook for fetching promotion statistics
export function usePromotionStatistics() {
  return useQuery({
    queryKey: ['promotion-statistics'],
    queryFn: async (): Promise<PromotionStatistics> => {
      // If statistics don't exist, calculate them
      const stats = storageService.getItem<PromotionStatistics>(STORAGE_KEYS.PROMOTIONS_STATISTICS);
      if (!stats) {
        return updateStatistics();
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return stats;
    },
  });
}

// Hook for saving a promotion (create or update)
export function useSavePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promotion: Promotion) => {
      // Get the current promotions from localStorage
      const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
      
      // Find if the promotion already exists
      const index = promotions.findIndex(p => p.id === promotion.id);
      
      // Update or add the promotion
      if (index >= 0) {
        promotions[index] = promotion;
      } else {
        promotions.push(promotion);
      }
      
      // Save the updated promotions back to localStorage
      storageService.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
      
      // Update statistics
      updateStatistics();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return promotion;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-statistics'] });
    },
  });
}

// Hook for deleting a promotion
export function useDeletePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promotionId: string) => {
      // Get the current promotions from localStorage
      const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
      
      // Filter out the promotion to delete
      const updatedPromotions = promotions.filter(p => p.id !== promotionId);
      
      // Save the updated promotions back to localStorage
      storageService.setItem(STORAGE_KEYS.PROMOTIONS, updatedPromotions);
      
      // Update statistics
      updateStatistics();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return promotionId;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-statistics'] });
    },
  });
}

// Hook for removing a product from a promotion
export function useRemoveProductFromPromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ promotionId, productId }: { promotionId: string, productId: string }) => {
      // Get the current promotions from localStorage
      const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
      
      // Find the promotion
      const promotionIndex = promotions.findIndex(p => p.id === promotionId);
      
      if (promotionIndex === -1) {
        throw new Error('Promotion not found');
      }
      
      const promotion = promotions[promotionIndex];
      
      // Handle based on promotion type
      if (promotion.type === 'bundle' && promotion.bundleProducts) {
        // For bundle promotions, remove the product from the bundleProducts array
        promotion.bundleProducts = promotion.bundleProducts.filter(id => id !== productId);
        
        // Update the promotion in the array
        promotions[promotionIndex] = promotion;
        
        // Save the updated promotions back to localStorage
        storageService.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
      } else if (promotion.productIds && promotion.productIds.includes(productId)) {
        // For multiple products promotions, remove the product from the productIds array
        promotion.productIds = promotion.productIds.filter(id => id !== productId);
        
        // Update the promotion in the array
        promotions[promotionIndex] = promotion;
        
        // Save the updated promotions back to localStorage
        storageService.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
      } else if (promotion.productId === productId) {
        // For other promotion types, if the main product is being removed, handle accordingly
        promotion.productId = undefined;
        
        // Update the promotion in the array
        promotions[promotionIndex] = promotion;
        
        // Save the updated promotions back to localStorage
        storageService.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
      } else if (promotion.secondaryProductId === productId) {
        // If the secondary product is being removed (for buy_x_get_y promotions)
        promotion.secondaryProductId = undefined;
        
        // Update the promotion in the array
        promotions[promotionIndex] = promotion;
        
        // Save the updated promotions back to localStorage
        storageService.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
      }
      
      // Update statistics
      updateStatistics();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { promotionId, productId };
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion', variables.promotionId] });
      queryClient.invalidateQueries({ queryKey: ['promotion-statistics'] });
    },
  });
}
