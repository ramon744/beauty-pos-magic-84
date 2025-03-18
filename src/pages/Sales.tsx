
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useProductSearch } from '@/hooks/use-product-search';
import { useProducts } from '@/hooks/use-products';
import { useSalesManager } from '@/hooks/use-sales-manager';
import { SalesHeader } from '@/components/sales/SalesHeader';
import { SalesContent } from '@/components/sales/SalesContent';
import { SalesDialogs } from '@/components/sales/SalesDialogs';

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    hasSearched, 
    isScanning, 
    toggleScanner 
  } = useProductSearch(useSalesManager().addProductToCart);

  const {
    // State variables
    isManagerAuthOpen,
    isDiscountDialogOpen,
    isPromotionDialogOpen,
    isDiscountsListOpen,
    isPaymentDialogOpen,
    discountReason,
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
  } = useSalesManager();

  return (
    <div className="space-y-6">
      <SalesHeader user={user} />
      
      <SalesContent 
        isMobile={isMobile}
        // Product search props
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        hasSearched={hasSearched}
        isScanning={isScanning}
        toggleScanner={toggleScanner}
        addProductToCart={useSalesManager().addProductToCart}
        
        // Cart section props
        cart={cart}
        linkedCustomer={linkedCustomer}
        updateCartItemQuantity={handleCartItemQuantityUpdate}
        initiateRemoveFromCart={initiateRemoveFromCart}
        handleOpenPromotions={handleOpenPromotions}
        availablePromotions={availablePromotions}
        onLinkCustomer={linkCustomer}
        onUnlinkCustomer={unlinkCustomer}
        
        // Sale summary props
        cartSubtotal={cartSubtotal}
        manualDiscount={manualDiscount}
        manualDiscountAmount={manualDiscountAmount}
        promotionDiscountAmount={promotionDiscountAmount}
        totalDiscountAmount={totalDiscountAmount}
        cartTotal={cartTotal}
        appliedPromotionDetails={appliedPromotionDetails}
        removeDiscount={useSalesManager().removeDiscount}
        removePromotion={useSalesManager().removePromotion}
        finalizeSale={finalizeSale}
        handleAddDiscount={handleAddDiscount}
        handleShowDiscountsList={handleShowDiscountsList}
        clearCart={handleClearCart}
      />
      
      <SalesDialogs 
        // Auth dialog props
        isManagerAuthOpen={isManagerAuthOpen}
        onCloseManagerAuth={() => {
          setIsManagerAuthOpen(false);
        }}
        onManagerAuthConfirm={handleManagerAuthConfirm}
        
        // Discount dialog props
        isDiscountDialogOpen={isDiscountDialogOpen}
        onCloseDiscountDialog={() => setIsDiscountDialogOpen(false)}
        discountForm={discountForm}
        onSubmitDiscount={handleSubmitDiscount}
        discountReason={discountReason}
        onDiscountReasonChange={(value) => setDiscountReason(value)}
        
        // Discounts list props
        isDiscountsListOpen={isDiscountsListOpen}
        onCloseDiscountsList={() => setIsDiscountsListOpen(false)}
        manualDiscount={manualDiscount}
        appliedPromotion={appliedPromotion}
        availablePromotions={availablePromotions}
        onRemoveManualDiscount={useSalesManager().removeDiscount}
        onRemovePromotion={useSalesManager().removePromotion}
        onDeleteDiscount={handleDeleteDiscount}
        onRequestAuth={requestManagerAuth}
        
        // Promotion dialog props
        isPromotionDialogOpen={isPromotionDialogOpen}
        onClosePromotionDialog={() => setIsPromotionDialogOpen(false)}
        selectedPromotionId={selectedPromotionId}
        onSelectPromotion={handleSelectPromotion}
        products={products}
        
        // Payment dialog props
        isPaymentDialogOpen={isPaymentDialogOpen}
        onClosePaymentDialog={() => setIsPaymentDialogOpen(false)}
        onConfirmPayment={handlePaymentConfirm}
        cartTotal={cartTotal}
      />
    </div>
  );
};

export default Sales;
