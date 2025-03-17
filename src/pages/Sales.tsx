
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Sales = () => {
  const isMobile = useIsMobile();
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
  
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    hasSearched, 
    isScanning, 
    toggleScanner 
  } = useProductSearch(addProductToCart);

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

  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isDiscountsListOpen, setIsDiscountsListOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<'manual' | 'promotion' | null>(null);
  const [managerAuthCallback, setManagerAuthCallback] = useState<() => void>(() => () => {});

  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      discountType: 'percentage',
      discountValue: 0
    }
  });

  const handleManagerAuthConfirm = () => {
    if (managerAuthCallback) {
      managerAuthCallback();
    } else if (productIdToDelete === "discount") {
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
    setManagerAuthCallback(() => () => {});
  };

  const requestManagerAuth = (callback: () => void) => {
    const executeAfterAuth = () => {
      callback();
      setIsManagerAuthOpen(false);
    };
    
    setManagerAuthCallback(() => executeAfterAuth);
    setIsManagerAuthOpen(true);
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
  };

  const finalizeSale = () => {
    toast({
      title: "Venda finalizada",
      description: `Total: R$ ${cartTotal.toFixed(2)}`
    });
    doFinalizeSale();
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
    
    if (user?.role === 'admin' || user?.role === 'manager') {
      applyManualDiscount({
        type: values.discountType,
        value: values.discountValue
      });
    } else {
      setProductIdToDelete("discount");
      
      discountForm.reset(values);
      
      setIsManagerAuthOpen(true);
    }
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

      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={() => {
          setIsManagerAuthOpen(false);
          setProductIdToDelete(null);
          setManagerAuthCallback(() => () => {});
        }}
        onConfirm={handleManagerAuthConfirm}
        title="Autenticação Gerencial"
        description="Esta operação requer autorização de um gerente ou administrador."
      />

      <Dialog 
        open={isDiscountDialogOpen} 
        onOpenChange={(open) => {
          if (!open) setIsDiscountDialogOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Desconto</DialogTitle>
            <DialogDescription>
              Configure o tipo e valor do desconto a ser aplicado.
            </DialogDescription>
          </DialogHeader>
          <DiscountForm 
            form={discountForm} 
            onSubmit={handleSubmitDiscount} 
          />
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDiscountDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="discount-form"
            >
              Aplicar Desconto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        requestManagerAuth={requestManagerAuth}
      />
    </div>
  );
};

export default Sales;
