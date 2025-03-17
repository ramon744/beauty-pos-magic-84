
import React from 'react';
import { CreditCard, Percent, Gift, List, Trash2, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Promotion, Customer } from '@/types';
import { formatPromotionBadge } from '@/utils/promotions-utils';
import { CustomerLinking } from './CustomerLinking';

interface SaleSummaryProps {
  cart: any[];
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
  handleOpenPromotions: () => void;
  handleShowDiscountsList: () => void;
  clearCart: () => void;
  availablePromotions: Promotion[];
  linkedCustomer: Customer | null;
  onLinkCustomer: (customer: Customer) => void;
  onUnlinkCustomer: () => void;
}

export const SaleSummary: React.FC<SaleSummaryProps> = ({
  cart,
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
  handleOpenPromotions,
  handleShowDiscountsList,
  clearCart,
  availablePromotions,
  linkedCustomer,
  onLinkCustomer,
  onUnlinkCustomer,
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resumo da Venda</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Customer linking component moved here */}
        <CustomerLinking 
          linkedCustomer={linkedCustomer}
          onLinkCustomer={onLinkCustomer}
          onUnlinkCustomer={onUnlinkCustomer}
        />
        
        <div className="space-y-4 mt-4">
          <div className="flex justify-between">
            <span className="font-medium">Total de Itens:</span>
            <span>{cart.reduce((total, item) => total + item.quantity, 0)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>R$ {cartSubtotal.toFixed(2)}</span>
          </div>
          
          {appliedPromotionDetails && (
            <div className="flex justify-between text-green-600">
              <span className="font-medium flex items-center">
                <Gift className="mr-1 h-4 w-4" />
                Promoção: {appliedPromotionDetails.name}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-1 text-green-600"
                  onClick={removePromotion}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
              <span>- R$ {promotionDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {manualDiscount && (
            <div className="flex justify-between text-destructive">
              <span className="font-medium flex items-center">
                <Percent className="mr-1 h-4 w-4" />
                Desconto {manualDiscount.type === 'percentage' ? `(${manualDiscount.value}%)` : ''}:
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-1 text-destructive"
                  onClick={removeDiscount}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
              <span>- R$ {manualDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {(manualDiscountAmount > 0 || promotionDiscountAmount > 0) && (
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Economia Total:</span>
              <span className="text-green-600">R$ {totalDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span>R$ {cartTotal.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          className="w-full" 
          size="lg" 
          disabled={cart.length === 0}
          onClick={finalizeSale}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Finalizar Venda
        </Button>
        
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            disabled={cart.length === 0}
            onClick={handleAddDiscount}
          >
            <Percent className="mr-1 h-4 w-4" />
            Desconto
          </Button>
          
          <Button 
            variant={availablePromotions.length > 0 ? "outline" : "ghost"} 
            className={`flex-1 ${availablePromotions.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={availablePromotions.length === 0}
            onClick={handleOpenPromotions}
          >
            <Gift className="mr-1 h-4 w-4" />
            Promoções
            {availablePromotions.length > 0 && (
              <Badge className="ml-1 bg-amber-100 text-amber-800 border-amber-200">
                {availablePromotions.length}
              </Badge>
            )}
          </Button>
        </div>
        
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleShowDiscountsList}
          >
            <List className="mr-1 h-4 w-4" />
            Listar
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            disabled={cart.length === 0}
            onClick={clearCart}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Limpar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
