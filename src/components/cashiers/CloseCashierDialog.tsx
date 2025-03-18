
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
import { WalletIcon, AlertCircleIcon, BadgeAlertIcon } from 'lucide-react';
import { useCashierOperations } from '@/hooks/use-cashier-operations';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CloseCashierDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
  cashierName: string;
  currentBalance: number;
  onCloseSuccess?: () => void;
  showManagerAuth?: () => void;
}

export const CloseCashierDialog = ({ 
  isOpen, 
  onClose, 
  cashierId,
  cashierName,
  currentBalance,
  onCloseSuccess,
  showManagerAuth
}: CloseCashierDialogProps) => {
  const [finalAmount, setFinalAmount] = useState<string>(currentBalance.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { closeCashier } = useCashierOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(finalAmount.replace(',', '.'));
      
      if (isNaN(amount) || amount < 0) {
        throw new Error('Informe um valor válido');
      }
      
      const result = await closeCashier(cashierId, amount);
      
      if (result) {
        resetForm();
        onCloseSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error closing cashier:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFinalAmount(currentBalance.toString());
  };

  const handleCancel = () => {
    if (showManagerAuth) {
      showManagerAuth();
    } else {
      onClose();
    }
  };

  const formattedBalance = currentBalance.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

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
            <WalletIcon className="h-5 w-5 text-amber-500" />
            Fechar Caixa
          </DialogTitle>
          <DialogDescription>
            Informe o valor final em caixa: {cashierName}
          </DialogDescription>
        </DialogHeader>
        
        <Alert>
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>
            Saldo atual calculado pelo sistema: {formattedBalance}
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="finalAmount" className="text-right">
                Valor Final
              </Label>
              <div className="col-span-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <Input
                    id="finalAmount"
                    value={finalAmount}
                    onChange={(e) => setFinalAmount(e.target.value)}
                    className="pl-9"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!finalAmount || isSubmitting}>
              {isSubmitting ? "Fechando..." : "Fechar Caixa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
