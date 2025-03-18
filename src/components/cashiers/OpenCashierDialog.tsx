
import React, { useState, useEffect } from 'react';
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
import { useCashier } from '@/hooks/use-cashier';
import { useAuth } from '@/contexts/AuthContext';

interface OpenCashierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OpenCashierDialog: React.FC<OpenCashierDialogProps> = ({ open, onOpenChange }) => {
  const [initialAmount, setInitialAmount] = useState<string>('200.00');
  const [registerNumber, setRegisterNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const { openCashier } = useCashier();
  const { user } = useAuth();
  
  // Definir o número do caixa com base no nome do usuário quando o diálogo é aberto
  useEffect(() => {
    if (open && user) {
      setRegisterNumber(`Caixa ${user.name.split(' ')[0]}`);
    }
  }, [open, user]);
  
  const handleOpenCashier = async () => {
    setLoading(true);
    try {
      // Validar campos
      if (!initialAmount || !registerNumber) {
        console.error('Todos os campos são obrigatórios');
        return;
      }
      
      // Converter para número
      const amountValue = parseFloat(initialAmount.replace(',', '.'));
      
      // Abrir caixa
      const result = openCashier(amountValue, registerNumber);
      
      if (result) {
        // Limpar campos
        setInitialAmount('200.00');
        setRegisterNumber('');
        
        // Fechar diálogo
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Abrir Novo Caixa</DialogTitle>
          <DialogDescription>
            Preencha os dados para abrir um novo caixa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="register" className="text-right">
              Caixa
            </Label>
            <Input
              id="register"
              placeholder="Ex: Caixa 1"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Valor Inicial
            </Label>
            <Input
              id="amount"
              placeholder="0,00"
              value={initialAmount}
              onChange={(e) => setInitialAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleOpenCashier} disabled={loading}>
            {loading ? 'Abrindo...' : 'Abrir Caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OpenCashierDialog;
