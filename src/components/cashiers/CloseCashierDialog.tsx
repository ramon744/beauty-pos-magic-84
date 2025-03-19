
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
import { WalletIcon, AlertCircleIcon, BadgeAlertIcon, ShieldAlertIcon } from 'lucide-react';
import { useCashierOperations } from '@/hooks/use-cashier-operations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';

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
  const [shortageReason, setShortageReason] = useState('');
  const [isDiscrepancy, setIsDiscrepancy] = useState(false);
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [managerName, setManagerName] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const { closeCashier } = useCashierOperations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const amount = parseFloat(finalAmount.replace(',', '.'));
      
      if (isNaN(amount) || amount < 0) {
        throw new Error('Informe um valor válido');
      }
      
      // Check for discrepancy between reported and calculated amounts
      if (amount < currentBalance) {
        setIsDiscrepancy(true);
        if (!shortageReason.trim()) {
          // If no reason provided yet, show the reason field
          return;
        }
        
        // If reason is provided but no manager auth yet, show manager auth dialog
        if (!managerName) {
          setIsManagerAuthOpen(true);
          return;
        }
      }
      
      // Continue with closing if no discrepancy or if already authorized
      proceedWithClosure(amount);
      
    } catch (error) {
      console.error('Error closing cashier:', error);
    }
  };

  const proceedWithClosure = async (amount: number) => {
    setIsSubmitting(true);
    try {
      // Pass the shortage reason and manager information if there's a discrepancy
      const discrepancyReason = isDiscrepancy ? shortageReason : undefined;
      const managerNameToPass = isDiscrepancy ? managerName : undefined;
      const managerIdToPass = isDiscrepancy ? managerId : undefined;
      
      const result = await closeCashier(cashierId, amount, discrepancyReason, managerNameToPass, managerIdToPass);
      
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

  const handleManagerAuth = (managerId?: string, managerNameValue?: string) => {
    setIsManagerAuthOpen(false);
    
    if (managerId && managerNameValue) {
      // Store the manager information
      setManagerName(managerNameValue);
      setManagerId(managerId);
      
      // Manager approved, proceed with closure
      const amount = parseFloat(finalAmount.replace(',', '.'));
      proceedWithClosure(amount);
    }
  };

  const resetForm = () => {
    setFinalAmount(currentBalance.toString());
    setShortageReason('');
    setIsDiscrepancy(false);
    setManagerName('');
    setManagerId('');
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
    <>
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
              
              {isDiscrepancy && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="shortageReason" className="text-right pt-2 text-red-500">
                    Motivo da quebra
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="shortageReason"
                      value={shortageReason}
                      onChange={(e) => setShortageReason(e.target.value)}
                      placeholder="Informe o motivo da diferença no valor"
                      className="border-red-300 focus:border-red-500"
                      required
                      rows={3}
                    />
                    {managerName ? (
                      <div className="flex items-center gap-1 text-amber-500 mt-1">
                        <ShieldAlertIcon className="h-4 w-4" />
                        <span>Autorização concedida por: {managerName}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-red-500 mt-1">
                        <BadgeAlertIcon className="h-4 w-4 inline-block mr-1" />
                        É necessário informar o motivo e autorização gerencial
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!finalAmount || isSubmitting || (isDiscrepancy && !shortageReason.trim())}
              >
                {isSubmitting ? "Fechando..." : "Fechar Caixa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={() => setIsManagerAuthOpen(false)}
        onConfirm={handleManagerAuth}
        title="Autorização para Quebra de Caixa"
        description="Esta operação requer autorização de um gerente ou administrador devido à diferença no valor do caixa."
      />
    </>
  );
};
