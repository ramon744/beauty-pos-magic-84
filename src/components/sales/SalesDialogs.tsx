
import React from 'react';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';
import { PromotionSelectionDialog } from '@/components/sales/PromotionSelectionDialog';
import { DiscountsList } from '@/components/sales/DiscountsList';
import { PaymentMethodsDialog } from '@/components/sales/PaymentMethodsDialog';
import { DiscountForm, DiscountFormValues } from '@/components/sales/DiscountForm';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { AppliedPromotion } from '@/utils/promotions-utils';
import { Product, Promotion } from '@/types';

interface SalesDialogsProps {
  // Auth dialog props
  isManagerAuthOpen: boolean;
  onCloseManagerAuth: () => void;
  onManagerAuthConfirm: (managerId?: string) => void;
  
  // Discount dialog props
  isDiscountDialogOpen: boolean;
  onCloseDiscountDialog: () => void;
  discountForm: UseFormReturn<DiscountFormValues>;
  onSubmitDiscount: (values: DiscountFormValues) => void;
  discountReason: string;
  onDiscountReasonChange: (value: string) => void;
  
  // Discounts list props
  isDiscountsListOpen: boolean;
  onCloseDiscountsList: () => void;
  manualDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  appliedPromotion: AppliedPromotion | null;
  availablePromotions: Promotion[];
  onRemoveManualDiscount: () => void;
  onRemovePromotion: () => void;
  onDeleteDiscount: (discountType: 'manual' | 'promotion', reason?: string) => void;
  onRequestAuth: (callback: () => void) => void;
  
  // Promotion dialog props
  isPromotionDialogOpen: boolean;
  onClosePromotionDialog: () => void;
  selectedPromotionId: string | null;
  onSelectPromotion: (promotionId: string | null) => void;
  products: Product[];
  
  // Payment dialog props
  isPaymentDialogOpen: boolean;
  onClosePaymentDialog: () => void;
  onConfirmPayment: (paymentDetails: any) => void;
  cartTotal: number;
}

export const SalesDialogs: React.FC<SalesDialogsProps> = ({
  // Auth dialog props
  isManagerAuthOpen,
  onCloseManagerAuth,
  onManagerAuthConfirm,
  
  // Discount dialog props
  isDiscountDialogOpen,
  onCloseDiscountDialog,
  discountForm,
  onSubmitDiscount,
  discountReason,
  onDiscountReasonChange,
  
  // Discounts list props
  isDiscountsListOpen,
  onCloseDiscountsList,
  manualDiscount,
  appliedPromotion,
  availablePromotions,
  onRemoveManualDiscount,
  onRemovePromotion,
  onDeleteDiscount,
  onRequestAuth,
  
  // Promotion dialog props
  isPromotionDialogOpen,
  onClosePromotionDialog,
  selectedPromotionId,
  onSelectPromotion,
  products,
  
  // Payment dialog props
  isPaymentDialogOpen,
  onClosePaymentDialog,
  onConfirmPayment,
  cartTotal
}) => {
  return (
    <>
      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={onCloseManagerAuth}
        onConfirm={onManagerAuthConfirm}
        title="Autenticação Gerencial"
        description="Esta operação requer autorização de um gerente ou administrador."
      />

      <ManagerAuthDialog
        isOpen={isDiscountDialogOpen}
        onClose={onCloseDiscountDialog}
        onConfirm={(managerId?: string) => {
          onManagerAuthConfirm(managerId);
          discountForm.handleSubmit(onSubmitDiscount)();
        }}
        title="Adicionar Desconto"
        description="Configure o tipo e valor do desconto a ser aplicado."
        customFormId="discount-form"
        customContent={
          <>
            <DiscountForm 
              form={discountForm} 
              onSubmit={onSubmitDiscount} 
            />
            <div className="mt-4">
              <label htmlFor="discountReason" className="text-sm font-medium">
                Motivo do desconto:
              </label>
              <Textarea
                id="discountReason"
                placeholder="Informe o motivo do desconto"
                value={discountReason}
                onChange={(e) => onDiscountReasonChange(e.target.value)}
                className="mt-2"
              />
            </div>
          </>
        }
      />

      <DiscountsList 
        isOpen={isDiscountsListOpen}
        onClose={onCloseDiscountsList}
        manualDiscount={manualDiscount}
        appliedPromotion={appliedPromotion}
        promotions={availablePromotions}
        onRemoveManualDiscount={onRemoveManualDiscount}
        onRemovePromotion={onRemovePromotion}
        onDeleteDiscount={onDeleteDiscount}
        onRequestAuth={onRequestAuth}
      />

      <PromotionSelectionDialog
        isOpen={isPromotionDialogOpen}
        onClose={onClosePromotionDialog}
        promotions={availablePromotions}
        selectedPromotionId={selectedPromotionId}
        onSelectPromotion={onSelectPromotion}
        products={products}
      />
      
      <PaymentMethodsDialog
        isOpen={isPaymentDialogOpen}
        onClose={onClosePaymentDialog}
        onConfirm={onConfirmPayment}
        total={cartTotal}
      />
    </>
  );
};
