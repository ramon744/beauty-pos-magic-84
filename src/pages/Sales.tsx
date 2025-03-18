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
import { toast as sonnerToast } from '@/components/ui/use-toast';

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { getUserCashierStatus } = useCashierOperations();
  const [isOpenCashierDialogOpen, setIsOpenCashierDialogOpen] = useState(false);
  
  const { cashier, isOpen } = getUserCashierStatus();
  
  const salesManager = useSalesManager();
  
  const handleAddProduct = (product: any) => {
    if (user && user.role === 'employee' && (!cashier || !isOpen)) {
      sonnerToast.error("Você não pode adicionar produtos com o caixa fechado");
      return;
    }
    salesManager.addProductToCart(product);
  };
  
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    hasSearched, 
    isScanning, 
    toggleScanner 
  } = useProductSearch(handleAddProduct);

  const {
    isManagerAuthOpen,
    isDiscountDialogOpen,
    isPromotionDialogOpen,
    isDiscountsListOpen,
    isPaymentDialogOpen,
    isPrintReceiptDialogOpen,
    discountReason,
    discountForm,
    lastCompletedSale,
    
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

  useEffect(() => {
    if (user && user.role === 'employee' && cashier && !isOpen) {
      setIsOpenCashierDialogOpen(true);
    }
  }, [user, cashier, isOpen]);

  if (user && user.role === 'employee' && !cashier) {
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

  if (user && user.role === 'employee' && cashier && !isOpen) {
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
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        hasSearched={hasSearched}
        isScanning={isScanning}
        toggleScanner={toggleScanner}
        addProductToCart={handleAddProduct}
        
        cart={cart}
        linkedCustomer={linkedCustomer}
        updateCartItemQuantity={handleCartItemQuantityUpdate}
        initiateRemoveFromCart={initiateRemoveFromCart}
        handleOpenPromotions={handleOpenPromotions}
        availablePromotions={availablePromotions}
        onLinkCustomer={linkCustomer}
        onUnlinkCustomer={unlinkCustomer}
        
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
        isManagerAuthOpen={isManagerAuthOpen}
        onCloseManagerAuth={() => {
          setIsManagerAuthOpen(false);
        }}
        onManagerAuthConfirm={handleManagerAuthConfirm}
        
        isDiscountDialogOpen={isDiscountDialogOpen}
        onCloseDiscountDialog={() => setIsDiscountDialogOpen(false)}
        discountForm={discountForm}
        onSubmitDiscount={handleSubmitDiscount}
        discountReason={discountReason}
        onDiscountReasonChange={(value) => setDiscountReason(value)}
        
        isDiscountsListOpen={isDiscountsListOpen}
        onCloseDiscountsList={() => setIsDiscountsListOpen(false)}
        manualDiscount={manualDiscount}
        appliedPromotion={appliedPromotion}
        availablePromotions={availablePromotions}
        onRemoveManualDiscount={removeDiscount}
        onRemovePromotion={removePromotion}
        onDeleteDiscount={handleDeleteDiscount}
        onRequestAuth={requestManagerAuth}
        
        isPromotionDialogOpen={isPromotionDialogOpen}
        onClosePromotionDialog={() => setIsPromotionDialogOpen(false)}
        selectedPromotionId={selectedPromotionId}
        onSelectPromotion={handleSelectPromotion}
        products={products}
        
        isPaymentDialogOpen={isPaymentDialogOpen}
        onClosePaymentDialog={() => setIsPaymentDialogOpen(false)}
        onConfirmPayment={handlePaymentConfirm}
        cartTotal={cartTotal}
      />
      
      <PrintReceiptDialog
        isOpen={isPrintReceiptDialogOpen}
        onClose={handleClosePrintDialog}
        onPrint={handlePrintReceipt}
        sale={lastCompletedSale}
      />
      
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
