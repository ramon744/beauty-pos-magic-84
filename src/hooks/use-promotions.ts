
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Promotion, PromotionType } from '@/types';
import { storageService } from '@/services/storage-service';

// Storage keys
const STORAGE_KEYS = {
  PROMOTIONS: 'promotions',
  STATISTICS: 'promotions-statistics',
};

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
];

// Initialize data in localStorage if it doesn't exist
const initializeData = () => {
  const existingPromotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS);
  
  if (!existingPromotions) {
    storageService.setItem(STORAGE_KEYS.PROMOTIONS, initialPromotions);
  }
  
  // Calculate and update statistics
  updateStatistics();
};

// Helper function to calculate statistics
const updateStatistics = (): PromotionStatistics => {
  const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
  
  const statistics: PromotionStatistics = {
    totalPromotions: promotions.length,
    activePromotions: promotions.filter(p => p.isActive).length,
    upcomingPromotions: promotions.filter(p => {
      const now = new Date();
      return p.startDate > now && p.isActive;
    }).length,
    expiredPromotions: promotions.filter(p => {
      const now = new Date();
      return p.endDate < now;
    }).length,
  };
  
  storageService.setItem(STORAGE_KEYS.STATISTICS, statistics);
  return statistics;
};

// Initialize data
initializeData();

// Hook for fetching all promotions
export function useFetchPromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
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
      const stats = storageService.getItem<PromotionStatistics>(STORAGE_KEYS.STATISTICS);
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
