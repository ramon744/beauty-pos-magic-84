
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, QrCode, CreditCardIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash';

interface PaymentMethodsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentDetails: PaymentDetails) => void;
  total: number;
}

export interface PaymentDetails {
  method: PaymentMethod;
  installments?: number;
  cashReceived?: number;
  change?: number;
}

export const PaymentMethodsDialog: React.FC<PaymentMethodsDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  total
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [installments, setInstallments] = useState<number>(1);
  const [cashReceived, setCashReceived] = useState<string>(total.toFixed(2));
  
  const handleConfirm = () => {
    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
    };
    
    if (paymentMethod === 'credit_card') {
      paymentDetails.installments = installments;
    } else if (paymentMethod === 'cash') {
      const cashAmount = parseFloat(cashReceived);
      paymentDetails.cashReceived = cashAmount;
      if (cashAmount >= total) {
        paymentDetails.change = cashAmount - total;
      }
    }
    
    onConfirm(paymentDetails);
  };
  
  const handleCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCashReceived(value);
    }
  };
  
  const calculateChange = (): number => {
    const cashAmount = parseFloat(cashReceived || '0');
    return cashAmount > total ? cashAmount - total : 0;
  };
  
  const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forma de Pagamento</DialogTitle>
          <DialogDescription>
            Valor total: R$ {total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <Card className={`cursor-pointer border-2 ${paymentMethod === 'credit_card' ? 'border-primary' : 'border-input'}`}>
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <RadioGroupItem value="credit_card" id="credit_card" className="sr-only" />
                  <Label htmlFor="credit_card" className="flex flex-col items-center gap-2 cursor-pointer">
                    <CreditCard className="h-6 w-6 mb-1" />
                    <span>Cartão de Crédito</span>
                  </Label>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className={`cursor-pointer border-2 ${paymentMethod === 'debit_card' ? 'border-primary' : 'border-input'}`}>
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <RadioGroupItem value="debit_card" id="debit_card" className="sr-only" />
                  <Label htmlFor="debit_card" className="flex flex-col items-center gap-2 cursor-pointer">
                    <CreditCardIcon className="h-6 w-6 mb-1" />
                    <span>Cartão de Débito</span>
                  </Label>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className={`cursor-pointer border-2 ${paymentMethod === 'pix' ? 'border-primary' : 'border-input'}`}>
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <RadioGroupItem value="pix" id="pix" className="sr-only" />
                  <Label htmlFor="pix" className="flex flex-col items-center gap-2 cursor-pointer">
                    <QrCode className="h-6 w-6 mb-1" />
                    <span>PIX</span>
                  </Label>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className={`cursor-pointer border-2 ${paymentMethod === 'cash' ? 'border-primary' : 'border-input'}`}>
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <RadioGroupItem value="cash" id="cash" className="sr-only" />
                  <Label htmlFor="cash" className="flex flex-col items-center gap-2 cursor-pointer">
                    <Banknote className="h-6 w-6 mb-1" />
                    <span>Dinheiro</span>
                  </Label>
                </CardContent>
              </Card>
            </div>
          </RadioGroup>
          
          {paymentMethod === 'credit_card' && (
            <div className="space-y-2">
              <Label htmlFor="installments">Parcelamento</Label>
              <Select value={installments.toString()} onValueChange={(value) => setInstallments(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o número de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {installmentOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}x {option === 1 ? 'à vista' : `de R$ ${(total / option).toFixed(2)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cash-received">Valor Recebido</Label>
                <Input
                  id="cash-received"
                  type="text"
                  value={cashReceived}
                  onChange={handleCashReceivedChange}
                  placeholder="0.00"
                />
              </div>
              
              <div className="p-3 bg-gray-100 rounded-md">
                <div className="flex justify-between">
                  <span className="font-medium">Valor da compra:</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Valor recebido:</span>
                  <span>R$ {parseFloat(cashReceived || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t mt-2">
                  <span>Troco:</span>
                  <span className={parseFloat(cashReceived || '0') >= total ? 'text-green-600' : 'text-red-600'}>
                    R$ {calculateChange().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm}
            disabled={paymentMethod === 'cash' && parseFloat(cashReceived || '0') < total}
          >
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
