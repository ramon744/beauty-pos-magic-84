
import React from 'react';
import { X, Minus, Plus, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LabelPreviewProps {
  product: {
    id: string;
    name: string;
    code: string;
    price: number;
    quantity: number;
  };
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}

export const LabelPreview: React.FC<LabelPreviewProps> = ({
  product,
  onRemove,
  onQuantityChange
}) => {
  return (
    <div className="border rounded-md p-3 relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive" 
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="pr-8">
        <div className="font-medium truncate mb-1">{product.name}</div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <Barcode className="h-3 w-3 mr-1" />
          <span>{product.code || 'Sem código'}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="font-bold">
            R$ {product.price.toFixed(2)}
          </div>
          
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => onQuantityChange(Math.max(1, product.quantity - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              min={1}
              value={product.quantity}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              className="h-8 w-14 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => onQuantityChange(product.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
