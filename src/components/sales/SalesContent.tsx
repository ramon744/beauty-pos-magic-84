
import React from 'react';
import { Card } from '@/components/ui/card';
import { ProductSearch } from '@/components/sales/ProductSearch';
import { CartSection } from '@/components/sales/CartSection';
import { SaleSummary } from '@/components/sales/SaleSummary';
import { Customer, Promotion } from '@/types';
import { AppliedPromotion } from '@/utils/promotions-utils';

interface SalesContentProps {
  isMobile: boolean;
  // Product search props
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  hasSearched: boolean;
  isScanning: boolean;
  toggleScanner: () => void;
  addProductToCart: (product: any, qty: number) => void;
  
  // Cart section props
  cart: any[];
  linkedCustomer: Customer | null;
  updateCartItemQuantity: (productId: string, newQuantity: number) => void;
  initiateRemoveFromCart: (productId: string) => void;
  handleOpenPromotions: () => void;
  availablePromotions: Promotion[];
  onLinkCustomer: (customer: Customer) => void;
  onUnlinkCustomer: () => void;
  
  // Sale summary props
  cartSubtotal: number;
  manualDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  manualDiscountAmount: number;
  promotionDiscountAmount: number;
  totalDiscountAmount: number;
  cartTotal: number;
  appliedPromotionDetails: Promotion | null;
  removeDiscount: () => void;
  removePromotion: () => void;
  finalizeSale: () => void;
  handleAddDiscount: () => void;
  handleShowDiscountsList: () => void;
  clearCart: () => void;
}

export const SalesContent: React.FC<SalesContentProps> = ({
  isMobile,
  // Product search props
  searchQuery,
  setSearchQuery,
  searchResults,
  hasSearched,
  isScanning,
  toggleScanner,
  addProductToCart,
  
  // Cart section props
  cart,
  linkedCustomer,
  updateCartItemQuantity,
  initiateRemoveFromCart,
  handleOpenPromotions,
  availablePromotions,
  onLinkCustomer,
  onUnlinkCustomer,
  
  // Sale summary props
  cartSubtotal,
  manualDiscount,
  manualDiscountAmount,
  promotionDiscountAmount,
  totalDiscountAmount,
  cartTotal,
  appliedPromotionDetails,
  removeDiscount,
  removePromotion,
  finalizeSale,
  handleAddDiscount,
  handleShowDiscountsList,
  clearCart
}) => {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-5">
      <div className={`space-y-4 sm:space-y-6 ${isMobile ? 'col-span-1' : 'md:col-span-3'}`}>
        <Card>
          <ProductSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            hasSearched={hasSearched}
            isScanning={isScanning}
            toggleScanner={toggleScanner}
            addProductToCart={addProductToCart}
          />
        </Card>

        <CartSection 
          cart={cart}
          linkedCustomer={linkedCustomer}
          updateCartItemQuantity={updateCartItemQuantity}
          initiateRemoveFromCart={initiateRemoveFromCart}
          handleOpenPromotions={handleOpenPromotions}
          availablePromotions={availablePromotions}
          onLinkCustomer={onLinkCustomer}
          onUnlinkCustomer={onUnlinkCustomer}
        />
      </div>

      <div className={`space-y-4 sm:space-y-6 ${isMobile ? 'col-span-1' : 'md:col-span-2'}`}>
        <SaleSummary 
          cart={cart}
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
          handleOpenPromotions={handleOpenPromotions}
          handleShowDiscountsList={handleShowDiscountsList}
          clearCart={clearCart}
          availablePromotions={availablePromotions}
          linkedCustomer={linkedCustomer}
          onLinkCustomer={onLinkCustomer}
          onUnlinkCustomer={onUnlinkCustomer}
        />
      </div>
    </div>
  );
};
