
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFetchProducts } from '@/hooks/use-products';
import { useFetchPromotions } from '@/hooks/use-promotions';
import { Product } from '@/types';
import { 
  getAvailablePromotions, 
  getBestPromotion, 
  calculatePromotionDiscount,
  AppliedPromotion 
} from '@/utils/promotions-utils';
import { CartItem } from './use-cart';

interface ManualDiscount {
  type: 'percentage' | 'fixed';
  value: number;
}

export const useDiscounts = (cart: CartItem[], cartSubtotal: number) => {
  const { toast } = useToast();
  const [manualDiscount, setManualDiscount] = useState<ManualDiscount | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  
  const { data: products = [] } = useFetchProducts();
  const { data: promotions = [] } = useFetchPromotions();

  const cartItemsForPromotions = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        return {
          product: product,
          quantity: item.quantity,
          price: item.price,
          discount: 0
        };
      } else {
        return {
          product: {
            id: item.id,
            name: item.name,
            description: item.description,
            code: '',
            salePrice: item.price,
            costPrice: item.price * 0.7,
            stock: item.stock,
            category: { id: '', name: item.category },
            createdAt: new Date(),
            updatedAt: new Date()
          },
          quantity: item.quantity,
          price: item.price,
          discount: 0
        };
      }
    });
  }, [cart, products]);

  const availablePromotions = useMemo(() => {
    if (cart.length === 0) return [];
    return getAvailablePromotions(cartItemsForPromotions, promotions);
  }, [cartItemsForPromotions, promotions, cart.length]);

  const appliedPromotion = useMemo((): AppliedPromotion | null => {
    if (cart.length === 0 || availablePromotions.length === 0) return null;
    
    if (selectedPromotionId === null && cart.length > 0) {
      return null;
    }
    
    if (selectedPromotionId) {
      const selectedPromotion = availablePromotions.find(p => p.id === selectedPromotionId);
      if (selectedPromotion) {
        return calculatePromotionDiscount(cartItemsForPromotions, selectedPromotion, products);
      }
      return null;
    }
    
    return getBestPromotion(cartItemsForPromotions, availablePromotions, products);
  }, [cartItemsForPromotions, availablePromotions, selectedPromotionId, products, cart.length]);

  const promotionDiscountAmount = useMemo(
    () => appliedPromotion?.discountAmount || 0,
    [appliedPromotion]
  );

  const appliedPromotionDetails = useMemo(() => {
    if (!appliedPromotion) return null;
    const promotion = promotions.find(p => p.id === appliedPromotion.promotionId);
    return promotion || null;
  }, [appliedPromotion, promotions]);

  const manualDiscountAmount = useMemo(() => {
    if (!manualDiscount) return 0;
    
    // Fix: Ensure we're calculating the discount correctly based on type
    if (manualDiscount.type === 'percentage') {
      return (cartSubtotal * manualDiscount.value) / 100;
    } else {
      // For fixed discount, ensure it doesn't exceed the subtotal
      return Math.min(manualDiscount.value, cartSubtotal);
    }
  }, [manualDiscount, cartSubtotal]);
  
  const totalDiscountAmount = manualDiscountAmount + promotionDiscountAmount;
  const cartTotal = Math.max(0, cartSubtotal - totalDiscountAmount);

  const handleSelectPromotion = (promotionId: string | null) => {
    setSelectedPromotionId(promotionId);
    toast({
      title: promotionId ? "Promoção aplicada" : "Promoções automáticas removidas",
      description: promotionId ? "Promoção selecionada aplicada ao carrinho" : "Nenhuma promoção será aplicada automaticamente"
    });
  };

  const removeDiscount = () => {
    setManualDiscount(null);
    toast({
      title: "Desconto removido",
      description: "Desconto manual removido da venda"
    });
  };

  const removePromotion = () => {
    setSelectedPromotionId(null);
    toast({
      title: "Promoção removida",
      description: "Promoção automática removida da venda"
    });
  };

  const applyManualDiscount = (discountData: ManualDiscount) => {
    // Fix: Ensure the discount value is processed as a number
    const value = typeof discountData.value === 'string' 
      ? parseFloat(discountData.value) 
      : discountData.value;
    
    // Fix: Only apply if the value is valid
    if (!isNaN(value) && value > 0) {
      setManualDiscount({
        type: discountData.type,
        value: value
      });
      
      toast({
        title: "Desconto aplicado",
        description: discountData.type === 'percentage' 
          ? `Desconto de ${value}% aplicado`
          : `Desconto de R$ ${value.toFixed(2)} aplicado`
      });
    } else {
      toast({
        title: "Valor inválido",
        description: "O valor do desconto deve ser maior que zero",
        variant: "destructive"
      });
    }
  };

  const resetDiscounts = () => {
    setManualDiscount(null);
    setSelectedPromotionId(null);
  };

  return {
    manualDiscount,
    appliedPromotion,
    availablePromotions,
    promotionDiscountAmount,
    manualDiscountAmount,
    totalDiscountAmount,
    cartTotal,
    appliedPromotionDetails,
    selectedPromotionId,
    handleSelectPromotion,
    removeDiscount,
    removePromotion,
    applyManualDiscount,
    resetDiscounts,
    setManualDiscount,
  };
};
