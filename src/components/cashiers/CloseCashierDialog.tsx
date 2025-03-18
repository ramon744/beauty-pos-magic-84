
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Cashier } from '@/types';
import { useCashier } from '@/hooks/use-cashier';

interface CloseCashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashier: Cashier | null;
}

const CloseCashierDialog: React.FC<CloseCashierDialogProps> = ({ 
  open, 
  onOpenChange,
  cashier
}) => {
  const [finalAmount, setFinalAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { closeCashier, formatCurrency } = useCashier();
  
  // Resetar o valor ao abrir o diálogo
  React.useEffect(() => {
    if (open && cashier) {
      setFinalAmount(cashier.currentAmount.toString());
    }
  }, [open, cashier]);
  
  const handleCloseCashier = async () => {
    if (!cashier) return;
    
    setLoading(true);
    try {
      // Converter para número
      const amountValue = parseFloat(finalAmount.replace(',', '.'));
      
      // Fechar caixa
      const result = closeCashier(cashier.id, amountValue);
      
      if (result) {
        // Fechar diálogo
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (!cashier) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
          <DialogDescription>
            Confirme o valor final para fechar o caixa {cashier.registerNumber}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-amount" className="text-right">
              Valor Atual
            </Label>
            <div className="col-span-3 font-semibold">
              {formatCurrency(cashier.currentAmount)}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="final-amount" className="text-right">
              Valor Final
            </Label>
            <Input
              id="final-amount"
              placeholder="0,00"
              value={finalAmount}
              onChange={(e) => setFinalAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCloseCashier} disabled={loading}>
            {loading ? 'Fechando...' : 'Fechar Caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseCashierDialog;
