
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
import { WalletIcon } from 'lucide-react';
import { useCashierOperations } from '@/hooks/use-cashier-operations';

interface OpenCashierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
  cashierName: string;
  onOpenSuccess?: () => void;
}

export const OpenCashierDialog = ({ 
  isOpen, 
  onClose, 
  cashierId,
  cashierName,
  onOpenSuccess 
}: OpenCashierDialogProps) => {
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openCashier } = useCashierOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(initialAmount.replace(',', '.'));
      
      if (isNaN(amount) || amount < 0) {
        throw new Error('Informe um valor válido');
      }
      
      const result = await openCashier(cashierId, amount);
      
      if (result) {
        resetForm();
        onOpenSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error opening cashier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setInitialAmount('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-green-500" />
            Abrir Caixa
          </DialogTitle>
          <DialogDescription>
            Informe o valor inicial para abrir o caixa: {cashierName}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="initialAmount" className="text-right">
                Valor Inicial
              </Label>
              <div className="col-span-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    id="initialAmount"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="pl-9"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!initialAmount || isSubmitting}>
              {isSubmitting ? "Abrindo..." : "Abrir Caixa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
