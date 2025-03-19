
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Promotion } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { toast } from '@/hooks/use-toast';

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
  const deletedPromotionIds = JSON.parse(localStorage.getItem('deletedPromotionIds') || '[]');
  
  // Filter out deleted promotions
  const availablePromotions = promotions.filter(
    promotion => !deletedPromotionIds.includes(promotion.id)
  );
  
  const now = new Date();
  
  const statistics: PromotionStatistics = {
    totalPromotions: availablePromotions.length,
    activePromotions: availablePromotions.filter(p => p.isActive).length,
    upcomingPromotions: availablePromotions.filter(p => {
      return p.isActive && new Date(p.startDate) > now;
    }).length,
    expiredPromotions: availablePromotions.filter(p => {
      return new Date(p.endDate) < now;
    }).length,
  };
  
  storageService.setItem(STORAGE_KEYS.PROMOTIONS_STATISTICS, statistics);
  return statistics;
};

// Initialize data with a check to avoid duplicating entries
const initializeIfNeeded = () => {
  // Verificar se os dados existem no Supabase primeiro
  try {
    const existingPromotions = storageService.getFromSupabase<Promotion[]>('promotions')
      .then(promotions => {
        if (!promotions || promotions.length === 0) {
          // Se não houver promoções no Supabase, inicialize com os dados locais
          console.log("Inicializando dados de promoções no Supabase");
          initialPromotions.forEach(async (promotion) => {
            try {
              await storageService.saveToSupabase('promotions', promotion);
            } catch (error) {
              console.error("Erro ao salvar promoção:", error);
            }
          });
        }
      })
      .catch(error => {
        console.error("Erro ao verificar promoções no Supabase:", error);
      });
  } catch (error) {
    console.error("Falha ao inicializar dados:", error);
  }
};

// Run initialization
try {
  initializeIfNeeded();
} catch (error) {
  console.error("Erro ao inicializar dados:", error);
}

// Helper to get deleted promotion IDs
const getDeletedPromotionIds = (): string[] => {
  return JSON.parse(localStorage.getItem('deletedPromotionIds') || '[]');
};

// Hook for fetching all promotions
export function useFetchPromotions() {
  return useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      try {
        // Tentar buscar do Supabase primeiro
        const allPromotions = await storageService.getFromSupabase<Promotion[]>('promotions');
        
        // Atualizar o localStorage com os dados mais recentes
        if (allPromotions && allPromotions.length > 0) {
          storageService.setItem(STORAGE_KEYS.PROMOTIONS, allPromotions);
        }
        
        // Filter out deleted promotions
        const deletedIds = getDeletedPromotionIds();
        return allPromotions.filter(promotion => !deletedIds.includes(promotion.id));
      } catch (error) {
        console.error("Erro ao buscar promoções:", error);
        
        // Se offline ou erro, mostrar mensagem
        if (!navigator.onLine) {
          toast({
            variant: "destructive",
            title: "Erro de conexão",
            description: "Não foi possível buscar as promoções. O aplicativo precisa de conexão com a internet."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao buscar promoções",
            description: "Ocorreu um erro ao buscar as promoções."
          });
        }
        
        // Retornar dados do localStorage como fallback
        const localPromotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
        const deletedIds = getDeletedPromotionIds();
        return localPromotions.filter(promotion => !deletedIds.includes(promotion.id));
      }
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
      
      // Check if promotion is deleted
      const deletedIds = getDeletedPromotionIds();
      if (deletedIds.includes(id)) {
        throw new Error('Promotion has been deleted');
      }
      
      try {
        // Tentar buscar do Supabase primeiro
        const promotions = await storageService.getFromSupabase<Promotion[]>('promotions', 'id', id);
        
        if (promotions && promotions.length > 0) {
          return promotions[0];
        }
        
        throw new Error('Promotion not found');
      } catch (error) {
        console.error(`Erro ao buscar promoção ${id}:`, error);
        
        // Se offline ou erro, mostrar mensagem
        if (!navigator.onLine) {
          toast({
            variant: "destructive",
            title: "Erro de conexão",
            description: "Não foi possível buscar os detalhes da promoção. O aplicativo precisa de conexão com a internet."
          });
        }
        
        // Tentar buscar do localStorage como fallback
        const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
        const promotion = promotions.find(p => p.id === id);
        if (!promotion) throw new Error('Promotion not found');
        
        return promotion;
      }
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

// Hook for fetching promotion statistics
export function usePromotionStatistics() {
  return useQuery({
    queryKey: ['promotion-statistics'],
    queryFn: async (): Promise<PromotionStatistics> => {
      try {
        // Buscar todas as promoções para calcular estatísticas atualizadas
        const promotions = await storageService.getFromSupabase<Promotion[]>('promotions');
        
        // Filter out deleted promotions
        const deletedIds = getDeletedPromotionIds();
        const availablePromotions = promotions.filter(
          promotion => !deletedIds.includes(promotion.id)
        );
        
        const now = new Date();
        
        const statistics: PromotionStatistics = {
          totalPromotions: availablePromotions.length,
          activePromotions: availablePromotions.filter(p => p.isActive).length,
          upcomingPromotions: availablePromotions.filter(p => {
            return p.isActive && new Date(p.startDate) > now;
          }).length,
          expiredPromotions: availablePromotions.filter(p => {
            return new Date(p.endDate) < now;
          }).length,
        };
        
        // Salvar estatísticas no localStorage para compatibilidade
        storageService.setItem(STORAGE_KEYS.PROMOTIONS_STATISTICS, statistics);
        
        return statistics;
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        
        // Se offline ou erro, mostrar mensagem
        if (!navigator.onLine) {
          toast({
            variant: "destructive",
            title: "Erro de conexão",
            description: "Não foi possível buscar as estatísticas. O aplicativo precisa de conexão com a internet."
          });
        }
        
        // Usar estatísticas do localStorage como fallback
        const stats = storageService.getItem<PromotionStatistics>(STORAGE_KEYS.PROMOTIONS_STATISTICS);
        if (stats) {
          return stats;
        }
        
        // Se não houver estatísticas no localStorage, calcular com base nas promoções locais
        return updateStatistics();
      }
    },
  });
}

// Hook for saving a promotion (create or update)
export function useSavePromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (promotion: Promotion) => {
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível salvar a promoção. O aplicativo precisa de conexão com a internet."
        });
        throw new Error('Aplicativo está offline. Não é possível salvar a promoção.');
      }
      
      try {
        // Salvar no Supabase
        const savedPromotion = await storageService.saveToSupabase('promotions', promotion);
        
        // Atualizar localStorage para compatibilidade
        const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
        const index = promotions.findIndex(p => p.id === promotion.id);
        
        if (index >= 0) {
          promotions[index] = savedPromotion;
        } else {
          promotions.push(savedPromotion);
        }
        
        storageService.setItem(STORAGE_KEYS.PROMOTIONS, promotions);
        
        // Atualizar estatísticas
        updateStatistics();
        
        return savedPromotion;
      } catch (error) {
        console.error('Erro ao salvar promoção:', error);
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: "Não foi possível salvar a promoção. Tente novamente."
        });
        throw error;
      }
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
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível excluir a promoção. O aplicativo precisa de conexão com a internet."
        });
        throw new Error('Aplicativo está offline. Não é possível excluir a promoção.');
      }
      
      try {
        // Excluir do Supabase
        await storageService.removeFromSupabase('promotions', promotionId);
        
        // Atualizar localStorage para compatibilidade
        const promotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
        const updatedPromotions = promotions.filter(p => p.id !== promotionId);
        storageService.setItem(STORAGE_KEYS.PROMOTIONS, updatedPromotions);
        
        // Store the deleted ID in localStorage for persistence
        const deletedIds = getDeletedPromotionIds();
        if (!deletedIds.includes(promotionId)) {
          deletedIds.push(promotionId);
          localStorage.setItem('deletedPromotionIds', JSON.stringify(deletedIds));
        }
        
        // Atualizar estatísticas
        updateStatistics();
        
        return promotionId;
      } catch (error) {
        console.error('Erro ao excluir promoção:', error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir",
          description: "Não foi possível excluir a promoção. Tente novamente."
        });
        
        // Mesmo com erro no Supabase, garantir que o ID está na lista de excluídos
        const deletedIds = getDeletedPromotionIds();
        if (!deletedIds.includes(promotionId)) {
          deletedIds.push(promotionId);
          localStorage.setItem('deletedPromotionIds', JSON.stringify(deletedIds));
        }
        
        throw error;
      }
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
      if (!navigator.onLine) {
        toast({
          variant: "destructive",
          title: "Erro de conexão",
          description: "Não foi possível remover o produto da promoção. O aplicativo precisa de conexão com a internet."
        });
        throw new Error('Aplicativo está offline. Não é possível modificar a promoção.');
      }
      
      try {
        // Buscar a promoção do Supabase
        const promotions = await storageService.getFromSupabase<Promotion[]>('promotions', 'id', promotionId);
        
        if (!promotions || promotions.length === 0) {
          throw new Error('Promotion not found');
        }
        
        const promotion = promotions[0];
        
        // Handle based on promotion type
        if (promotion.type === 'bundle' && promotion.bundleProducts) {
          // For bundle promotions, remove the product from the bundleProducts array
          promotion.bundleProducts = promotion.bundleProducts.filter(id => id !== productId);
        } else if (promotion.productIds && promotion.productIds.includes(productId)) {
          // For multiple products promotions, remove the product from the productIds array
          promotion.productIds = promotion.productIds.filter(id => id !== productId);
        } else if (promotion.productId === productId) {
          // For other promotion types, if the main product is being removed, handle accordingly
          promotion.productId = undefined;
        } else if (promotion.secondaryProductId === productId) {
          // If the secondary product is being removed (for buy_x_get_y promotions)
          promotion.secondaryProductId = undefined;
        }
        
        // Salvar a promoção atualizada no Supabase
        await storageService.saveToSupabase('promotions', promotion);
        
        // Atualizar o localStorage para compatibilidade
        const localPromotions = storageService.getItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS) || [];
        const promotionIndex = localPromotions.findIndex(p => p.id === promotionId);
        
        if (promotionIndex >= 0) {
          localPromotions[promotionIndex] = promotion;
          storageService.setItem(STORAGE_KEYS.PROMOTIONS, localPromotions);
        }
        
        // Atualizar estatísticas
        updateStatistics();
        
        return { promotionId, productId };
      } catch (error) {
        console.error('Erro ao remover produto da promoção:', error);
        toast({
          variant: "destructive",
          title: "Erro ao modificar promoção",
          description: "Não foi possível remover o produto da promoção. Tente novamente."
        });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotion', variables.promotionId] });
      queryClient.invalidateQueries({ queryKey: ['promotion-statistics'] });
    },
  });
}
