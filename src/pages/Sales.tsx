
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { useProductSearch } from '@/hooks/use-product-search';
import { useDiscounts } from '@/hooks/use-discounts';
import { useProducts } from '@/hooks/use-products';
import { useSalesManagerAuth } from '@/hooks/use-sales-manager-auth';
import { useSalesDialogs } from '@/hooks/use-sales-dialogs';
import { SalesHeader } from '@/components/sales/SalesHeader';
import { SalesContainer } from '@/components/sales/SalesContainer';
import { SalesDialogs } from '@/components/sales/SalesDialogs';
import { Product } from '@/types';

const Sales = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  
  const { 
    cart, 
    cartSubtotal, 
    addProductToCart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart, 
    setCart 
  } = useCart();
  
  // Create a typed version of addProductToCart that accepts the main Product type
  const handleAddProductToCart = (product: Product, qty: number) => {
    addProductToCart(product, qty);
  };
  
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    hasSearched, 
    isScanning, 
    toggleScanner 
  } = useProductSearch(handleAddProductToCart);

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

  const {
    isManagerAuthOpen,
    setIsManagerAuthOpen,
    handleManagerAuthConfirm,
    requestManagerAuth,
    initiateRemoveFromCart,
    initiateClearCart,
    initiateDeleteDiscount,
    initiateApplyDiscount,
    discountToDelete
  } = useSalesManagerAuth({
    removeFromCart,
    clearCart,
    resetDiscounts,
    removeDiscount,
    removePromotion,
    applyManualDiscount
  });

  const {
    isDiscountDialogOpen,
    isPromotionDialogOpen,
    isDiscountsListOpen,
    discountForm,
    handleOpenDiscountDialog,
    handleCloseDiscountDialog,
    handleOpenPromotionDialog,
    handleClosePromotionDialog,
    handleOpenDiscountsList,
    handleCloseDiscountsList
  } = useSalesDialogs();

  const handleCartItemQuantityUpdate = (productId: string, newQuantity: number) => {
    updateCartItemQuantity(productId, newQuantity);
  };

  const handleClearCart = () => {
    initiateClearCart(cart.length > 0);
  };

  const doFinalizeSale = () => {
    clearCart();
    resetDiscounts();
  };

  const finalizeSale = () => {
    toast({
      title: "Venda finalizada",
      description: `Total: R$ ${cartTotal.toFixed(2)}`
    });
    doFinalizeSale();
  };

  const handleSubmitDiscount = (values: any) => {
    handleCloseDiscountDialog();
    
    if (user?.role === 'admin' || user?.role === 'manager') {
      applyManualDiscount({
        type: values.discountType,
        value: values.discountValue
      });
    } else {
      initiateApplyDiscount(values);
    }
  };

  const handleDeleteDiscount = (discountType: 'manual' | 'promotion') => {
    initiateDeleteDiscount(discountType);
    handleCloseDiscountsList();
  };

  return (
    <div className="space-y-6">
      <SalesHeader userName={user?.name} />

      <SalesContainer 
        cart={cart}
        cartSubtotal={cartSubtotal}
        manualDiscount={manualDiscount}
        manualDiscountAmount={manualDiscountAmount}
        promotionDiscountAmount={promotionDiscountAmount}
        totalDiscountAmount={totalDiscountAmount}
        cartTotal={cartTotal}
        appliedPromotionDetails={appliedPromotionDetails}
        availablePromotions={availablePromotions}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        hasSearched={hasSearched}
        isScanning={isScanning}
        toggleScanner={toggleScanner}
        addProductToCart={handleAddProductToCart}
        updateCartItemQuantity={handleCartItemQuantityUpdate}
        initiateRemoveFromCart={initiateRemoveFromCart}
        removeDiscount={removeDiscount}
        removePromotion={removePromotion}
        finalizeSale={finalizeSale}
        handleOpenDiscountDialog={handleOpenDiscountDialog}
        handleOpenPromotionDialog={handleOpenPromotionDialog}
        handleOpenDiscountsList={handleOpenDiscountsList}
        handleClearCart={handleClearCart}
      />

      <SalesDialogs 
        isManagerAuthOpen={isManagerAuthOpen}
        isDiscountDialogOpen={isDiscountDialogOpen}
        isPromotionDialogOpen={isPromotionDialogOpen}
        isDiscountsListOpen={isDiscountsListOpen}
        onCloseManagerAuth={() => {
          setIsManagerAuthOpen(false);
        }}
        onConfirmManagerAuth={handleManagerAuthConfirm}
        onCloseDiscountDialog={handleCloseDiscountDialog}
        onClosePromotionDialog={handleClosePromotionDialog}
        onCloseDiscountsList={handleCloseDiscountsList}
        discountForm={discountForm}
        onSubmitDiscount={handleSubmitDiscount}
        manualDiscount={manualDiscount}
        appliedPromotion={appliedPromotion}
        availablePromotions={availablePromotions}
        selectedPromotionId={selectedPromotionId}
        onSelectPromotion={handleSelectPromotion}
        onRemoveManualDiscount={removeDiscount}
        onRemovePromotion={removePromotion}
        onDeleteDiscount={handleDeleteDiscount}
        requestManagerAuth={requestManagerAuth}
        products={products}
      />
    </div>
  );
};

export default Sales;
