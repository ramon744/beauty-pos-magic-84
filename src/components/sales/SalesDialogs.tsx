
import React from 'react';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';
import { DiscountsList } from '@/components/sales/DiscountsList';
import { PromotionSelectionDialog } from '@/components/sales/PromotionSelectionDialog';
import { DiscountForm, DiscountFormValues } from '@/components/sales/DiscountForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { Product, Promotion } from '@/types';
import { AppliedPromotion } from '@/utils/promotions-utils';

interface SalesDialogsProps {
  isManagerAuthOpen: boolean;
  isDiscountDialogOpen: boolean;
  isPromotionDialogOpen: boolean;
  isDiscountsListOpen: boolean;
  onCloseManagerAuth: () => void;
  onConfirmManagerAuth: () => void;
  onCloseDiscountDialog: () => void;
  onClosePromotionDialog: () => void;
  onCloseDiscountsList: () => void;
  discountForm: UseFormReturn<DiscountFormValues>;
  onSubmitDiscount: (values: DiscountFormValues) => void;
  manualDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  appliedPromotion: AppliedPromotion | null;
  availablePromotions: Promotion[];
  selectedPromotionId: string | null;
  onSelectPromotion: (promotionId: string | null) => void;
  onRemoveManualDiscount: () => void;
  onRemovePromotion: () => void;
  onDeleteDiscount: (discountType: 'manual' | 'promotion') => void;
  requestManagerAuth: (callback: () => void) => void;
  products: Product[];
}

export const SalesDialogs: React.FC<SalesDialogsProps> = ({
  isManagerAuthOpen,
  isDiscountDialogOpen,
  isPromotionDialogOpen,
  isDiscountsListOpen,
  onCloseManagerAuth,
  onConfirmManagerAuth,
  onCloseDiscountDialog,
  onClosePromotionDialog,
  onCloseDiscountsList,
  discountForm,
  onSubmitDiscount,
  manualDiscount,
  appliedPromotion,
  availablePromotions,
  selectedPromotionId,
  onSelectPromotion,
  onRemoveManualDiscount,
  onRemovePromotion,
  onDeleteDiscount,
  requestManagerAuth,
  products
}) => {
  return (
    <>
      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={onCloseManagerAuth}
        onConfirm={onConfirmManagerAuth}
        title="Autenticação Gerencial"
        description="Esta operação requer autorização de um gerente ou administrador."
      />

      <Dialog 
        open={isDiscountDialogOpen} 
        onOpenChange={(open) => {
          if (!open) onCloseDiscountDialog();
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
            onSubmit={onSubmitDiscount} 
          />
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCloseDiscountDialog}
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
        onClose={onCloseDiscountsList}
        manualDiscount={manualDiscount}
        appliedPromotion={appliedPromotion}
        promotions={availablePromotions}
        onRemoveManualDiscount={onRemoveManualDiscount}
        onRemovePromotion={onRemovePromotion}
        onDeleteDiscount={onDeleteDiscount}
        onRequestAuth={requestManagerAuth}
      />

      <PromotionSelectionDialog
        isOpen={isPromotionDialogOpen}
        onClose={onClosePromotionDialog}
        promotions={availablePromotions}
        selectedPromotionId={selectedPromotionId}
        onSelectPromotion={onSelectPromotion}
        products={products}
        requestManagerAuth={requestManagerAuth}
      />
    </>
  );
};
