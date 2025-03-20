
import React, { useState } from 'react';
import { SalesContent } from '@/components/sales/SalesContent';
import { useCart } from '@/hooks/use-cart';
import { useDiscounts } from '@/hooks/use-discounts';
import { useProductSearch } from '@/hooks/use-product-search';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSalesManager } from '@/hooks/use-sales-manager';
import { Customer } from '@/types';

const Sales = () => {
  const isMobile = useIsMobile();
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  
  // Cart functionality
  const { 
    cart, 
    cartSubtotal, 
    addProductToCart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  
  // Product search functionality
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    hasSearched, 
    isScanning, 
    toggleScanner 
  } = useProductSearch(addProductToCart);
  
  // Discounts functionality
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
  
  // Sales manager functionality
  const {
    finalizeSale,
    handleAddDiscount,
    handleOpenPromotions,
    handleShowDiscountsList,
    initiateRemoveFromCart,
  } = useSalesManager();

  // Customer management
  const handleLinkCustomer = (customer: Customer) => {
    setLinkedCustomer(customer);
  };

  const handleUnlinkCustomer = () => {
    setLinkedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">PDV - Ponto de Venda</h1>
      <SalesContent 
        isMobile={isMobile}
        // Product search props
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        hasSearched={hasSearched}
        isScanning={isScanning}
        toggleScanner={toggleScanner}
        addProductToCart={addProductToCart}
        
        // Cart section props
        cart={cart}
        linkedCustomer={linkedCustomer}
        updateCartItemQuantity={updateCartItemQuantity}
        initiateRemoveFromCart={initiateRemoveFromCart}
        handleOpenPromotions={handleOpenPromotions}
        availablePromotions={availablePromotions}
        onLinkCustomer={handleLinkCustomer}
        onUnlinkCustomer={handleUnlinkCustomer}
        
        // Sale summary props
        cartSubtotal={cartSubtotal}
        manualDiscount={manualDiscount}
        manualDiscountAmount={manualDiscountAmount}
        promotionDiscountAmount={promotionDiscountAmount}
        totalDiscountAmount={totalDiscountAmount}
        cartTotal={cartTotal}
        appliedPromotionDetails={appliedPromotionDetails}
        removeDiscount={removeDiscount}
        removePromotion={removePromotion}
        finalizeSale={finalizeSale}
        handleAddDiscount={handleAddDiscount}
        handleShowDiscountsList={handleShowDiscountsList}
        clearCart={clearCart}
      />
    </div>
  );
};

export default Sales;
