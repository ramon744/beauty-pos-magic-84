import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';
import { PromotionSelectionDialog } from '@/components/sales/PromotionSelectionDialog';
import { DiscountsList } from '@/components/sales/DiscountsList';
import { useCart } from '@/hooks/use-cart';
import { useProductSearch } from '@/hooks/use-product-search';
import { useDiscounts } from '@/hooks/use-discounts';
import { ProductSearch } from '@/components/sales/ProductSearch';
import { CartSection } from '@/components/sales/CartSection';
import { SaleSummary } from '@/components/sales/SaleSummary';
import { DiscountForm, discountFormSchema, DiscountFormValues } from '@/components/sales/DiscountForm';
import { useProducts } from '@/hooks/use-products';

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: products = [] } = useProducts();
  
  // Cart state and hooks
  const { 
    cart, 
    cartSubtotal, 
    addProductToCart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart, 
    setCart 
  } = useCart();
  
  // Product search hooks
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    hasSearched, 
    isScanning, 
    toggleScanner 
  } = useProductSearch(addProductToCart);

  // Discounts hooks
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

  // Dialog states
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isDiscountsListOpen, setIsDiscountsListOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<'manual' | 'promotion' | null>(null);
  const [managerAuthCallback, setManagerAuthCallback] = useState<() => void>(() => () => {});

  // Discount form
  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      discountType: 'percentage',
      discountValue: 0
    }
  });

  // Auth and confirmation functions
  const handleManagerAuthConfirm = () => {
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
    const executeAfterAuth = () => {
      callback();
      setIsManagerAuthOpen(false);
    };
    
    setManagerAuthCallback(() => executeAfterAuth);
    setIsManagerAuthOpen(true);
  };

  // Cart related functions
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
  };

  const finalizeSale = () => {
    toast({
      title: "Venda finalizada",
      description: `Total: R$ ${cartTotal.toFixed(2)}`
    });
    doFinalizeSale();
  };

  // Discount related functions
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

  const handleDeleteDiscount = (discountType: 'manual' | 'promotion') => {
    setDiscountToDelete(discountType);
    setProductIdToDelete("delete-discount");
    setIsDiscountsListOpen(false);
    setIsManagerAuthOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <ShoppingCart className="mr-2 h-8 w-8" />
          Nova Venda
        </h2>
        <p className="text-muted-foreground">
          <span className="font-medium">Atendente: {user?.name}</span> • 
          {new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

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
            updateCartItemQuantity={handleCartItemQuantityUpdate}
            initiateRemoveFromCart={initiateRemoveFromCart}
            handleOpenPromotions={handleOpenPromotions}
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
            handleAddDiscount={handleAddDiscount}
            handleOpenPromotions={handleOpenPromotions}
            handleShowDiscountsList={handleShowDiscountsList}
            clearCart={handleClearCart}
            availablePromotions={availablePromotions}
          />
        </div>
      </div>

      {/* Dialogs */}
      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={() => {
          setIsManagerAuthOpen(false);
          setProductIdToDelete(null);
        }}
        onConfirm={handleManagerAuthConfirm}
        title="Autenticação Gerencial"
        description="Esta operação requer autorização de um gerente ou administrador."
      />

      <ManagerAuthDialog
        isOpen={isDiscountDialogOpen}
        onClose={() => setIsDiscountDialogOpen(false)}
        onConfirm={discountForm.handleSubmit(handleSubmitDiscount)}
        title="Adicionar Desconto"
        description="Configure o tipo e valor do desconto a ser aplicado."
        customFormId="discount-form"
        customContent={
          <DiscountForm 
            form={discountForm} 
            onSubmit={handleSubmitDiscount} 
          />
        }
      />

      <DiscountsList 
        isOpen={isDiscountsListOpen}
        onClose={() => setIsDiscountsListOpen(false)}
        manualDiscount={manualDiscount}
        appliedPromotion={appliedPromotion}
        promotions={availablePromotions}
        onRemoveManualDiscount={removeDiscount}
        onRemovePromotion={removePromotion}
        onDeleteDiscount={handleDeleteDiscount}
        onRequestAuth={requestManagerAuth}
      />

      <PromotionSelectionDialog
        isOpen={isPromotionDialogOpen}
        onClose={() => setIsPromotionDialogOpen(false)}
        promotions={availablePromotions}
        selectedPromotionId={selectedPromotionId}
        onSelectPromotion={handleSelectPromotion}
        products={products}
      />
    </div>
  );
};

export default Sales;
