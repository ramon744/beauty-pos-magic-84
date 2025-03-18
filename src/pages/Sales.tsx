
import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useProductSearch } from '@/hooks/use-product-search';
import { useProducts } from '@/hooks/use-products';
import { useSalesManager } from '@/hooks/use-sales-manager';
import { SalesHeader } from '@/components/sales/SalesHeader';
import { SalesContent } from '@/components/sales/SalesContent';
import { SalesDialogs } from '@/components/sales/SalesDialogs';
import { PrintReceiptDialog } from '@/components/sales/PrintReceiptDialog';
import { useCashierOperations } from '@/hooks/use-cashier-operations';
import { OpenCashierDialog } from '@/components/cashiers/OpenCashierDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { getUserCashierStatus } = useCashierOperations();
  const [isOpenCashierDialogOpen, setIsOpenCashierDialogOpen] = useState(false);
  
  // Get cashier status
  const { cashier, isOpen } = getUserCashierStatus();
  
  // Create a reference to the sales manager hook once to avoid multiple instances
  const salesManager = useSalesManager();
  
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    hasSearched, 
    isScanning, 
    toggleScanner 
  } = useProductSearch(salesManager.addProductToCart);

  const {
    // State variables
    isManagerAuthOpen,
    isDiscountDialogOpen,
    isPromotionDialogOpen,
    isDiscountsListOpen,
    isPaymentDialogOpen,
    isPrintReceiptDialogOpen,
    discountReason,
    discountForm,
    lastCompletedSale,
    
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
    handlePrintReceipt,
    handleClosePrintDialog,
    
    // Functions for dialog control
    setIsManagerAuthOpen,
    setIsDiscountDialogOpen,
    setIsPromotionDialogOpen,
    setIsDiscountsListOpen,
    setIsPaymentDialogOpen,
    setDiscountReason,
    removeDiscount,
    removePromotion,
    addProductToCart
  } = salesManager;

  // Force cashier check on page load
  useEffect(() => {
    if (user && cashier && !isOpen) {
      setIsOpenCashierDialogOpen(true);
    }
  }, [user, cashier, isOpen]);

  // If user has no assigned cashier, show a warning
  if (user && !cashier) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md p-6 bg-background border rounded-lg shadow-sm">
          <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center mb-4">Caixa Não Vinculado</h2>
          <p className="text-muted-foreground text-center mb-6">
            Você não possui um caixa vinculado ao seu usuário. 
            Por favor, contate um administrador para vincular um caixa.
          </p>
        </div>
      </div>
    );
  }

  // If cashier is not open, show the cashier status
  if (user && cashier && !isOpen) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md p-6 bg-background border rounded-lg shadow-sm">
          <AlertCircleIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center mb-4">Caixa Fechado</h2>
          <p className="text-muted-foreground text-center mb-6">
            O caixa {cashier.name} está fechado. Abra o caixa para iniciar as vendas.
          </p>
          <div className="flex justify-center">
            <Button onClick={() => setIsOpenCashierDialogOpen(true)}>
              Abrir Caixa
            </Button>
          </div>
          
          <OpenCashierDialog
            isOpen={isOpenCashierDialogOpen}
            onClose={() => setIsOpenCashierDialogOpen(false)}
            cashierId={cashier.id}
            cashierName={cashier.name}
            onOpenSuccess={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

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
        addProductToCart={addProductToCart}
        
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
        removeDiscount={removeDiscount}
        removePromotion={removePromotion}
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
        onRemoveManualDiscount={removeDiscount}
        onRemovePromotion={removePromotion}
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
      
      {/* Print Receipt Dialog */}
      <PrintReceiptDialog
        isOpen={isPrintReceiptDialogOpen}
        onClose={handleClosePrintDialog}
        onPrint={handlePrintReceipt}
        sale={lastCompletedSale}
      />
      
      {/* Open Cashier Dialog */}
      {cashier && (
        <OpenCashierDialog
          isOpen={isOpenCashierDialogOpen}
          onClose={() => setIsOpenCashierDialogOpen(false)}
          cashierId={cashier.id}
          cashierName={cashier.name}
          onOpenSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
};

export default Sales;
