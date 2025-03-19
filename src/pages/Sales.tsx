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
import { useNavigate } from 'react-router-dom';

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { getUserCashierStatus } = useCashierOperations();
  const [isOpenCashierDialogOpen, setIsOpenCashierDialogOpen] = useState(false);
  const navigate = useNavigate();
  
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

  // No need to force cashier check on page load, user will only be prompted when they click "Abrir Caixa"
  // Removed the useEffect that forces open the dialog

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
          <div className="flex justify-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar para Dashboard
            </Button>
          </div>
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
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate('/')} variant="outline">
              Voltar para Dashboard
            </Button>
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
        addProductToCart={salesManager.addProductToCart}
        
        // Cart section props
        cart={salesManager.cart}
        linkedCustomer={salesManager.linkedCustomer}
        updateCartItemQuantity={salesManager.handleCartItemQuantityUpdate}
        initiateRemoveFromCart={salesManager.initiateRemoveFromCart}
        handleOpenPromotions={salesManager.handleOpenPromotions}
        availablePromotions={salesManager.availablePromotions}
        onLinkCustomer={salesManager.linkCustomer}
        onUnlinkCustomer={salesManager.unlinkCustomer}
        
        // Sale summary props
        cartSubtotal={salesManager.cartSubtotal}
        manualDiscount={salesManager.manualDiscount}
        manualDiscountAmount={salesManager.manualDiscountAmount}
        promotionDiscountAmount={salesManager.promotionDiscountAmount}
        totalDiscountAmount={salesManager.totalDiscountAmount}
        cartTotal={salesManager.cartTotal}
        appliedPromotionDetails={salesManager.appliedPromotionDetails}
        removeDiscount={salesManager.removeDiscount}
        removePromotion={salesManager.removePromotion}
        finalizeSale={salesManager.finalizeSale}
        handleAddDiscount={salesManager.handleAddDiscount}
        handleShowDiscountsList={salesManager.handleShowDiscountsList}
        clearCart={salesManager.handleClearCart}
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
        isOpen={salesManager.isPrintReceiptDialogOpen}
        onClose={salesManager.handleClosePrintDialog}
        onPrint={salesManager.handlePrintReceipt}
        sale={salesManager.lastCompletedSale}
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
