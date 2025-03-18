
import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useDiscounts } from '@/hooks/use-discounts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { PaymentDetails, MixedPayment } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DiscountFormValues, discountFormSchema } from '@/components/sales/DiscountForm';

export const useSalesManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isDiscountsListOpen, setIsDiscountsListOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<'manual' | 'promotion' | null>(null);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [discountAuthorizedBy, setDiscountAuthorizedBy] = useState<string | undefined>(undefined);

  const { 
    cart, 
    cartSubtotal, 
    linkedCustomer,
    addProductToCart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart, 
    setCart,
    linkCustomer,
    unlinkCustomer
  } = useCart();
  
  const { 
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
  } = useDiscounts(cart, cartSubtotal);

  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      discountType: 'percentage',
      discountValue: 0
    }
  });

  const handleManagerAuthConfirm = (managerId?: string) => {
    setDiscountAuthorizedBy(managerId);
    
    if (productIdToDelete === "discount") {
      const { discountType, discountValue } = discountForm.getValues();
      applyManualDiscount({
        type: discountType,
        value: discountValue
      });
    } else if (productIdToDelete === "clear-all") {
      doFinalizeSale();
    } else if (productIdToDelete === "delete-discount") {
      if (discountToDelete === 'manual') {
        removeDiscount();
      } else if (discountToDelete === 'promotion') {
        removePromotion();
      }
      setDiscountToDelete(null);
    } else if (productIdToDelete) {
      removeFromCart(productIdToDelete);
    }
    
    setProductIdToDelete(null);
    setIsManagerAuthOpen(false);
  };

  const requestManagerAuth = (callback: () => void) => {
    setIsManagerAuthOpen(true);
    setProductIdToDelete("manager-request");
    
    const managerAuthWrapper = (managerId?: string) => {
      setDiscountAuthorizedBy(managerId);
      callback();
      setIsManagerAuthOpen(false);
    };
    
    return managerAuthWrapper;
  };

  const initiateRemoveFromCart = (productId: string) => {
    setProductIdToDelete(productId);
    setIsManagerAuthOpen(true);
  };

  const handleCartItemQuantityUpdate = (productId: string, newQuantity: number) => {
    const result = updateCartItemQuantity(productId, newQuantity);
    if (result) {
      setProductIdToDelete(result);
      setIsManagerAuthOpen(true);
    }
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setProductIdToDelete("clear-all");
      setIsManagerAuthOpen(true);
    }
  };

  const doFinalizeSale = () => {
    clearCart();
    resetDiscounts();
    setDiscountReason("");
    setDiscountAuthorizedBy(undefined);
  };

  const handleOpenPaymentDialog = () => {
    setIsPaymentDialogOpen(true);
  };
  
  const handlePaymentConfirm = (paymentDetails: PaymentDetails | MixedPayment) => {
    const order = {
      id: Date.now().toString(),
      items: cart,
      customer: linkedCustomer,
      paymentMethod: 'payments' in paymentDetails ? 'mixed' : paymentDetails.method,
      total: cartSubtotal,
      discount: totalDiscountAmount,
      finalTotal: cartTotal,
      paymentDetails: paymentDetails,
      seller: user,
      createdAt: new Date(),
      appliedPromotionId: appliedPromotion?.promotionId,
      promotionDiscountAmount: promotionDiscountAmount,
      discountAuthorizedBy: discountAuthorizedBy,
      discountReason: discountReason
    };
    
    const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
    orders.push(order);
    storageService.setItem(STORAGE_KEYS.ORDERS, orders);
    
    let confirmationMessage = `Venda finalizada: R$ ${cartTotal.toFixed(2)}`;
    
    if ('payments' in paymentDetails) {
      confirmationMessage += ` | Pagamento misto com ${paymentDetails.payments.length} formas`;
    } else if (paymentDetails.method === 'credit_card' && paymentDetails.installments && paymentDetails.installments > 1) {
      confirmationMessage += ` em ${paymentDetails.installments}x`;
    } else if (paymentDetails.method === 'cash' && paymentDetails.change && paymentDetails.change > 0) {
      confirmationMessage += ` | Troco: R$ ${paymentDetails.change.toFixed(2)}`;
    }
    
    if (linkedCustomer) {
      confirmationMessage += ` | Cliente: ${linkedCustomer.name}`;
    }
    
    toast({
      title: "Pagamento confirmado",
      description: confirmationMessage
    });
    
    setIsPaymentDialogOpen(false);
    doFinalizeSale();
  };

  const finalizeSale = () => {
    if (cart.length > 0) {
      handleOpenPaymentDialog();
    }
  };

  const handleAddDiscount = () => {
    discountForm.reset({
      discountType: 'percentage',
      discountValue: 0
    });
    setIsDiscountDialogOpen(true);
  };

  const handleSubmitDiscount = (values: DiscountFormValues) => {
    setIsDiscountDialogOpen(false);
    setProductIdToDelete("discount");
    setIsManagerAuthOpen(true);
  };

  const handleOpenPromotions = () => {
    setIsPromotionDialogOpen(true);
  };

  const handleShowDiscountsList = () => {
    setIsDiscountsListOpen(true);
  };

  const handleDeleteDiscount = (discountType: 'manual' | 'promotion', reason?: string) => {
    setDiscountReason(reason || "");
    setDiscountToDelete(discountType);
    setProductIdToDelete("delete-discount");
    setIsDiscountsListOpen(false);
    setIsManagerAuthOpen(true);
  };

  return {
    // State variables
    isManagerAuthOpen,
    isDiscountDialogOpen,
    isPromotionDialogOpen,
    isDiscountsListOpen,
    isPaymentDialogOpen,
    discountReason,
    discountAuthorizedBy,
    discountForm,
    
    // Values from other hooks
    cart,
    cartSubtotal,
    cartTotal,
    linkedCustomer,
    manualDiscount,
    appliedPromotion,
    availablePromotions,
    promotionDiscountAmount,
    manualDiscountAmount,
    totalDiscountAmount,
    appliedPromotionDetails,
    selectedPromotionId,
    
    // Functions
    handleManagerAuthConfirm,
    requestManagerAuth,
    initiateRemoveFromCart,
    handleCartItemQuantityUpdate,
    handleClearCart,
    handlePaymentConfirm,
    finalizeSale,
    handleAddDiscount,
    handleSubmitDiscount,
    handleOpenPromotions,
    handleShowDiscountsList,
    handleDeleteDiscount,
    handleSelectPromotion,
    linkCustomer,
    unlinkCustomer,
    
    // Functions for dialog control
    setIsManagerAuthOpen,
    setIsDiscountDialogOpen,
    setIsPromotionDialogOpen,
    setIsDiscountsListOpen,
    setIsPaymentDialogOpen,
    setDiscountReason
  };
};
