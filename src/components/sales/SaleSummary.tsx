
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
        {/* Customer linking component */}
        <CustomerLinking 
          linkedCustomer={linkedCustomer}
          onLinkCustomer={onLinkCustomer}
          onUnlinkCustomer={onUnlinkCustomer}
        />
        
        <div className="space-y-4 mt-4">
          <div className="flex justify-between">
            <span className="font-medium text-sm sm:text-base">Total de Itens:</span>
            <span className="text-sm sm:text-base">{cart.reduce((total, item) => total + item.quantity, 0)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-sm sm:text-base">Subtotal:</span>
            <span className="text-sm sm:text-base">R$ {cartSubtotal.toFixed(2)}</span>
          </div>
          
          {appliedPromotionDetails && (
            <div className="flex justify-between text-green-600">
              <span className="font-medium flex items-center text-sm sm:text-base">
                <Gift className="mr-1 h-4 w-4" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  Promoção: {appliedPromotionDetails.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 ml-1 text-green-600"
                  onClick={removePromotion}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
              <span className="text-sm sm:text-base">- R$ {promotionDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {manualDiscount && (
            <div className="flex justify-between text-destructive">
              <span className="font-medium flex items-center text-sm sm:text-base">
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
              <span className="text-sm sm:text-base">- R$ {manualDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {(manualDiscountAmount > 0 || promotionDiscountAmount > 0) && (
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium text-sm sm:text-base">Economia Total:</span>
              <span className="text-green-600 text-sm sm:text-base">R$ {totalDiscountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-base sm:text-lg font-bold pt-2 border-t">
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
            className="flex-1 text-xs sm:text-sm"
            disabled={cart.length === 0}
            onClick={handleAddDiscount}
          >
            <Percent className="mr-1 h-4 w-4" />
            <span className="truncate">Desconto</span>
          </Button>
          
          <Button 
            variant={availablePromotions.length > 0 ? "outline" : "ghost"} 
            className={`flex-1 text-xs sm:text-sm ${availablePromotions.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={availablePromotions.length === 0}
            onClick={handleOpenPromotions}
          >
            <Gift className="mr-1 h-4 w-4" />
            <span className="truncate">Promoções</span>
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
            className="flex-1 text-xs sm:text-sm"
            onClick={handleShowDiscountsList}
          >
            <List className="mr-1 h-4 w-4" />
            <span className="truncate">Listar</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 text-xs sm:text-sm"
            disabled={cart.length === 0}
            onClick={clearCart}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            <span className="truncate">Limpar</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
