
import React from 'react';
import { ShoppingCart, Gift, UserRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CartItemTable } from './CartItemTable';
import { CustomerLinking } from './CustomerLinking';
import { formatPromotionBadge } from '@/utils/promotions-utils';
import { Promotion, Customer } from '@/types';

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  quantity: number;
  subtotal: number;
}

interface CartSectionProps {
  cart: CartItem[];
  linkedCustomer: Customer | null;
  updateCartItemQuantity: (productId: string, newQuantity: number) => void;
  initiateRemoveFromCart: (productId: string) => void;
  handleOpenPromotions: () => void;
  availablePromotions: Promotion[];
  onLinkCustomer: (customer: Customer) => void;
  onUnlinkCustomer: () => void;
}

export const CartSection: React.FC<CartSectionProps> = ({ 
  cart, 
  linkedCustomer,
  updateCartItemQuantity, 
  initiateRemoveFromCart,
  handleOpenPromotions,
  availablePromotions,
  onLinkCustomer,
  onUnlinkCustomer
}) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Itens no Carrinho
          </div>
          {availablePromotions.length > 0 && (
            <Badge 
              variant="outline" 
              className="ml-2 cursor-pointer bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
              onClick={handleOpenPromotions}
            >
              <Gift className="mr-1 h-3 w-3" />
              {formatPromotionBadge(availablePromotions.length)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CustomerLinking 
          linkedCustomer={linkedCustomer}
          onLinkCustomer={onLinkCustomer}
          onUnlinkCustomer={onUnlinkCustomer}
        />
        
        <CartItemTable 
          cart={cart} 
          updateCartItemQuantity={updateCartItemQuantity}
          initiateRemoveFromCart={initiateRemoveFromCart}
        />
      </CardContent>
    </Card>
  );
};
