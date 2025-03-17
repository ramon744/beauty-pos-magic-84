
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/common/DataTable';

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

interface CartItemTableProps {
  cart: CartItem[];
  updateCartItemQuantity: (productId: string, newQuantity: number) => void;
  initiateRemoveFromCart: (productId: string) => void;
}

export const CartItemTable: React.FC<CartItemTableProps> = ({ 
  cart, 
  updateCartItemQuantity, 
  initiateRemoveFromCart 
}) => {
  const cartColumns: ColumnDef<CartItem>[] = [
    {
      accessorKey: 'name',
      header: 'Produto',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qtd',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => updateCartItemQuantity(row.original.id, row.original.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center">{row.original.quantity}</span>
          <Button 
            variant="outline" 
            size="icon"
            className="h-7 w-7" 
            onClick={() => updateCartItemQuantity(row.original.id, row.original.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }) => (
        <div className="text-right">R$ {row.original.price.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ row }) => (
        <div className="text-right font-medium">R$ {row.original.subtotal.toFixed(2)}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => initiateRemoveFromCart(row.original.id)}
            className="text-destructive hover:text-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {cart.length > 0 ? (
        <div className="rounded-md border">
          <DataTable
            columns={cartColumns}
            data={cart}
          />
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          Carrinho vazio. Adicione produtos para iniciar a venda.
        </div>
      )}
    </>
  );
};
