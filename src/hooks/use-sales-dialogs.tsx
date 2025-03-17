
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DiscountFormValues, discountFormSchema } from '@/components/sales/DiscountForm';

export const useSalesDialogs = () => {
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isDiscountsListOpen, setIsDiscountsListOpen] = useState(false);
  
  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      discountType: 'percentage',
      discountValue: 0
    }
  });

  const handleOpenDiscountDialog = () => {
    discountForm.reset({
      discountType: 'percentage',
      discountValue: 0
    });
    setIsDiscountDialogOpen(true);
  };

  const handleCloseDiscountDialog = () => {
    setIsDiscountDialogOpen(false);
  };

  const handleOpenPromotionDialog = () => {
    setIsPromotionDialogOpen(true);
  };

  const handleClosePromotionDialog = () => {
    setIsPromotionDialogOpen(false);
  };

  const handleOpenDiscountsList = () => {
    setIsDiscountsListOpen(true);
  };

  const handleCloseDiscountsList = () => {
    setIsDiscountsListOpen(false);
  };

  return {
    isDiscountDialogOpen,
    isPromotionDialogOpen,
    isDiscountsListOpen,
    discountForm,
    handleOpenDiscountDialog,
    handleCloseDiscountDialog,
    handleOpenPromotionDialog,
    handleClosePromotionDialog,
    handleOpenDiscountsList,
    handleCloseDiscountsList
  };
};
