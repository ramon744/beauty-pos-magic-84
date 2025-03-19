
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Product } from '@/types';

interface StockStatusProps {
  product: Product;
}

export function StockStatus({ product }: StockStatusProps) {
  const { stock, minimumStock } = product;
  
  // Helper function to determine stock status
  const getStockStatus = (product: Product) => {
    const { stock, minimumStock } = product;
    
    if (stock === 0) {
      return { status: 'outOfStock', label: 'Esgotado', color: 'text-red-600' };
    }
    
    if (minimumStock && stock <= minimumStock) {
      return { status: 'belowMinimum', label: 'Abaixo do Mínimo', color: 'text-red-600' };
    }
    
    if (minimumStock && stock <= minimumStock * 1.5) {
      return { status: 'nearMinimum', label: 'Próximo do Mínimo', color: 'text-amber-600' };
    }
    
    return { status: 'inStock', label: 'Em Estoque', color: 'text-green-600' };
  };
  
  const stockStatus = getStockStatus(product);
  
  return (
    <div className="flex items-center gap-2">
      <span className={`font-medium ${stockStatus.color}`}>
        {stock}
      </span>
      {(stockStatus.status === 'belowMinimum' || stockStatus.status === 'nearMinimum') && (
        <div className="relative" title={stockStatus.label}>
          <AlertTriangle className={`h-4 w-4 ${stockStatus.status === 'belowMinimum' ? 'text-red-600' : 'text-amber-600'}`} />
          {minimumStock && (
            <span className="text-xs text-muted-foreground ml-1">
              Min: {minimumStock}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
