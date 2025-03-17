
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DiscountFormValues } from '@/components/sales/DiscountForm';

interface UseSalesManagerAuthProps {
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  resetDiscounts: () => void;
  removeDiscount: () => void;
  removePromotion: () => void;
  applyManualDiscount: (discount: { type: 'percentage' | 'fixed'; value: number }) => void;
}

export const useSalesManagerAuth = ({
  removeFromCart,
  clearCart,
  resetDiscounts,
  removeDiscount,
  removePromotion,
  applyManualDiscount
}: UseSalesManagerAuthProps) => {
  const { toast } = useToast();
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [discountToDelete, setDiscountToDelete] = useState<'manual' | 'promotion' | null>(null);
  const [managerAuthCallback, setManagerAuthCallback] = useState<() => void>(() => () => {});
  const [actionType, setActionType] = useState<string | null>(null);
  const [pendingDiscountForm, setPendingDiscountForm] = useState<DiscountFormValues | null>(null);

  const handleManagerAuthConfirm = () => {
    // Store values before closing dialog
    const currentAction = actionType;
    const currentProductId = productIdToDelete;
    const currentCallback = managerAuthCallback;
    const currentPendingDiscount = pendingDiscountForm;
    
    // Close the dialog
    setIsManagerAuthOpen(false);
    
    // Execute action based on type
    if (typeof currentCallback === 'function') {
      currentCallback();
    } else if (currentAction === 'discount' && currentPendingDiscount) {
      applyManualDiscount({
        type: currentPendingDiscount.discountType,
        value: currentPendingDiscount.discountValue
      });
    } else if (currentAction === 'clear-all') {
      clearCart();
      resetDiscounts();
      toast({
        title: "Carrinho limpo",
        description: "Todos os itens foram removidos"
      });
    } else if (currentAction === 'delete-discount') {
      if (discountToDelete === 'manual') {
        removeDiscount();
      } else if (discountToDelete === 'promotion') {
        removePromotion();
      }
      setDiscountToDelete(null);
    } else if (currentAction === 'remove-item' && currentProductId) {
      removeFromCart(currentProductId);
    }
    
    // Reset states after action execution
    setProductIdToDelete(null);
    setActionType(null);
    setManagerAuthCallback(() => () => {});
    setPendingDiscountForm(null);
  };

  const requestManagerAuth = (callback: () => void) => {
    const executeAfterAuth = () => {
      callback();
      setIsManagerAuthOpen(false);
    };
    
    setManagerAuthCallback(() => executeAfterAuth);
    setIsManagerAuthOpen(true);
  };

  const initiateRemoveFromCart = (productId: string) => {
    setProductIdToDelete(productId);
    setActionType('remove-item');
    setIsManagerAuthOpen(true);
  };

  const initiateClearCart = (hasItems: boolean) => {
    if (hasItems) {
      setActionType('clear-all');
      setIsManagerAuthOpen(true);
    }
  };

  const initiateDeleteDiscount = (discountType: 'manual' | 'promotion') => {
    setDiscountToDelete(discountType);
    setActionType('delete-discount');
    setIsManagerAuthOpen(true);
  };

  const initiateApplyDiscount = (values: DiscountFormValues) => {
    setActionType('discount');
    setPendingDiscountForm(values);
    setIsManagerAuthOpen(true);
  };

  return {
    isManagerAuthOpen,
    setIsManagerAuthOpen,
    handleManagerAuthConfirm,
    requestManagerAuth,
    initiateRemoveFromCart,
    initiateClearCart,
    initiateDeleteDiscount,
    initiateApplyDiscount,
    discountToDelete
  };
};
