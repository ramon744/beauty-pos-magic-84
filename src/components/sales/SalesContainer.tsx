
import React from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { ProductSearch } from '@/components/sales/ProductSearch';
import { CartSection } from '@/components/sales/CartSection';
import { SaleSummary } from '@/components/sales/SaleSummary';
import { useIsMobile } from '@/hooks/use-mobile';
import { Promotion, Product } from '@/types';
import { CartItem } from '@/hooks/use-cart';
import { AppliedPromotion } from '@/utils/promotions-utils';

interface SalesContainerProps {
  cart: CartItem[];
  cartSubtotal: number;
  manualDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  manualDiscountAmount: number;
  promotionDiscountAmount: number;
  totalDiscountAmount: number;
  cartTotal: number;
  appliedPromotionDetails: Promotion | null;
  availablePromotions: Promotion[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Product[];
  hasSearched: boolean;
  isScanning: boolean;
  toggleScanner: () => void;
  addProductToCart: (product: Product, qty: number) => void;
  updateCartItemQuantity: (productId: string, newQuantity: number) => void;
  initiateRemoveFromCart: (productId: string) => void;
  removeDiscount: () => void;
  removePromotion: () => void;
  finalizeSale: () => void;
  handleOpenDiscountDialog: () => void;
  handleOpenPromotionDialog: () => void;
  handleOpenDiscountsList: () => void;
  handleClearCart: () => void;
}

export const SalesContainer: React.FC<SalesContainerProps> = ({
  cart,
  cartSubtotal,
  manualDiscount,
  manualDiscountAmount,
  promotionDiscountAmount,
  totalDiscountAmount,
  cartTotal,
  appliedPromotionDetails,
  availablePromotions,
  searchQuery,
  setSearchQuery,
  searchResults,
  hasSearched,
  isScanning,
  toggleScanner,
  addProductToCart,
  updateCartItemQuantity,
  initiateRemoveFromCart,
  removeDiscount,
  removePromotion,
  finalizeSale,
  handleOpenDiscountDialog,
  handleOpenPromotionDialog,
  handleOpenDiscountsList,
  handleClearCart
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <div className={`space-y-6 ${isMobile ? 'col-span-5' : 'col-span-3'}`}>
        <Card>
          <CardHeader className="pb-3">
            <ProductSearch 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              hasSearched={hasSearched}
              isScanning={isScanning}
              toggleScanner={toggleScanner}
              addProductToCart={addProductToCart}
            />
          </CardHeader>
        </Card>

        <CartSection 
          cart={cart}
          updateCartItemQuantity={updateCartItemQuantity}
          initiateRemoveFromCart={initiateRemoveFromCart}
          handleOpenPromotions={handleOpenPromotionDialog}
          availablePromotions={availablePromotions}
        />
      </div>

      <div className={`space-y-6 ${isMobile ? 'col-span-5' : 'col-span-2'}`}>
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
          handleAddDiscount={handleOpenDiscountDialog}
          handleOpenPromotions={handleOpenPromotionDialog}
          handleShowDiscountsList={handleOpenDiscountsList}
          clearCart={handleClearCart}
          availablePromotions={availablePromotions}
        />
      </div>
    </div>
  );
};
