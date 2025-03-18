
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, QrCode, CreditCardIcon, Plus, Trash } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentMethod, PaymentDetails, MixedPayment } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PaymentMethodsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentDetails: PaymentDetails | MixedPayment) => void;
  total: number;
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
  const [paymentAmount, setPaymentAmount] = useState<string>(total.toFixed(2));
  const [mixedPayments, setMixedPayments] = useState<PaymentDetails[]>([]);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [isMixedPayment, setIsMixedPayment] = useState<boolean>(false);
  
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('credit_card');
      setInstallments(1);
      setCashReceived(total.toFixed(2));
      setPaymentAmount(total.toFixed(2));
      setMixedPayments([]);
      setTotalPaid(0);
      setIsMixedPayment(false);
    }
  }, [isOpen, total]);
  
  const getRemainingAmount = (): number => {
    return Math.max(0, parseFloat((total - totalPaid).toFixed(2)));
  };
  
  const handleSinglePaymentConfirm = () => {
    const paymentDetails: PaymentDetails = {
      method: paymentMethod,
      isCompletePayment: true
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
  
  const handleMixedPaymentConfirm = () => {
    if (mixedPayments.length === 0) return;
    
    const mixedPayment: MixedPayment = {
      payments: mixedPayments,
      totalPaid: totalPaid
    };
    
    onConfirm(mixedPayment);
  };
  
  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    const remaining = getRemainingAmount();
    
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    
    if (amount > remaining) {
      setPaymentAmount(remaining.toFixed(2));
      return;
    }
    
    const newPayment: PaymentDetails = {
      method: paymentMethod,
      amount: amount
    };
    
    if (paymentMethod === 'credit_card') {
      newPayment.installments = installments;
    } else if (paymentMethod === 'cash') {
      const cashAmount = parseFloat(cashReceived);
      newPayment.cashReceived = cashAmount;
      
      if (cashAmount > amount) {
        newPayment.change = cashAmount - amount;
      }
    }
    
    setMixedPayments([...mixedPayments, newPayment]);
    const newTotalPaid = totalPaid + amount;
    setTotalPaid(newTotalPaid);
    
    if (newTotalPaid < total) {
      setPaymentAmount((total - newTotalPaid).toFixed(2));
      setCashReceived((total - newTotalPaid).toFixed(2));
    }
  };
  
  const handleRemovePayment = (index: number) => {
    const payment = mixedPayments[index];
    const newMixedPayments = [...mixedPayments];
    newMixedPayments.splice(index, 1);
    
    setMixedPayments(newMixedPayments);
    setTotalPaid(totalPaid - (payment.amount || 0));
  };
  
  const handleCashReceivedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCashReceived(value);
    }
  };
  
  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setPaymentAmount(value);
    }
  };
  
  const calculateChange = (): number => {
    if (!isMixedPayment) {
      const cashAmount = parseFloat(cashReceived || '0');
      return cashAmount > total ? cashAmount - total : 0;
    } else {
      const amount = parseFloat(paymentAmount || '0');
      const cashAmount = parseFloat(cashReceived || '0');
      return cashAmount > amount ? cashAmount - amount : 0;
    }
  };
  
  const isPaymentComplete = (): boolean => {
    if (!isMixedPayment) {
      return paymentMethod === 'cash' ? parseFloat(cashReceived || '0') >= total : true;
    } else {
      const epsilon = 0.01;
      return totalPaid >= total - epsilon;
    }
  };
  
  const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      case 'cash': return 'Dinheiro';
      case 'transfer': return 'Transferência';
      default: return method;
    }
  };
  
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      case 'debit_card': return <CreditCardIcon className="h-4 w-4" />;
      case 'pix': return <QrCode className="h-4 w-4" />;
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'transfer': return <CreditCardIcon className="h-4 w-4" />;
      default: return null;
    }
  };
  
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as PaymentMethod);
  };
  
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
          <div className="flex justify-between items-center">
            <div className="font-medium">Tipo de Pagamento</div>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={() => setIsMixedPayment(!isMixedPayment)}
              className="text-xs"
            >
              {isMixedPayment ? "Pagamento Único" : "Dividir Pagamento"}
            </Button>
          </div>
          
          <RadioGroup 
            value={paymentMethod} 
            onValueChange={handlePaymentMethodChange}
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
              <Card 
                className={`cursor-pointer border-2 ${paymentMethod === 'pix' ? 'border-primary' : 'border-input'}`}
                onClick={() => setPaymentMethod('pix')}
              >
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
          
          {isMixedPayment && (
            <>
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Valor do Pagamento</Label>
                <Input
                  id="payment-amount"
                  type="text"
                  value={paymentAmount}
                  onChange={handlePaymentAmountChange}
                  placeholder="0.00"
                />
              </div>
            </>
          )}
          
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
                  <span>R$ {isMixedPayment ? paymentAmount : total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Valor recebido:</span>
                  <span>R$ {parseFloat(cashReceived || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t mt-2">
                  <span>Troco:</span>
                  <span className={calculateChange() > 0 ? 'text-green-600' : 'text-red-600'}>
                    R$ {calculateChange().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {isMixedPayment && (
            <>
              <div className="flex justify-between items-center">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={handleAddPayment}
                  disabled={parseFloat(paymentAmount || '0') <= 0 || parseFloat(paymentAmount || '0') > getRemainingAmount() || (paymentMethod === 'cash' && parseFloat(cashReceived || '0') < parseFloat(paymentAmount || '0'))}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Pagamento
                </Button>
              </div>
              
              {mixedPayments.length > 0 && (
                <div className="space-y-3 mt-2">
                  <div className="font-medium">Pagamentos Adicionados:</div>
                  
                  {mixedPayments.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.method)}
                        <div>
                          <div className="font-medium">{getPaymentMethodLabel(payment.method)}</div>
                          <div className="text-sm text-muted-foreground">
                            R$ {payment.amount?.toFixed(2)}
                            {payment.installments && payment.installments > 1 && ` em ${payment.installments}x`}
                            {payment.change && payment.change > 0 && ` (Troco: R$ ${payment.change.toFixed(2)})`}
                          </div>
                        </div>
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemovePayment(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm">Total a pagar: <span className="font-medium">R$ {total.toFixed(2)}</span></div>
                      <div className="text-sm">Total pago: <span className="font-medium">R$ {totalPaid.toFixed(2)}</span></div>
                    </div>
                    
                    <Badge variant={getRemainingAmount() <= 0 ? "success" : "secondary"} className="ml-auto">
                      {getRemainingAmount() <= 0 
                        ? "Pagamento Completo" 
                        : `Falta: R$ ${getRemainingAmount().toFixed(2)}`}
                    </Badge>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          {isMixedPayment ? (
            <Button 
              type="button"
              onClick={handleMixedPaymentConfirm}
              disabled={mixedPayments.length === 0 || !isPaymentComplete()}
            >
              Confirmar Pagamento
            </Button>
          ) : (
            <Button 
              type="button"
              onClick={handleSinglePaymentConfirm}
              disabled={paymentMethod === 'cash' && parseFloat(cashReceived || '0') < total}
            >
              Confirmar Pagamento
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
