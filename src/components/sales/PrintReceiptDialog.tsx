
import React from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

interface PrintReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  sale: any | null;
}

export const PrintReceiptDialog: React.FC<PrintReceiptDialogProps> = ({
  isOpen,
  onClose,
  onPrint,
  sale
}) => {
  if (!sale) return null;
  
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deseja imprimir o cupom?</DialogTitle>
          <DialogDescription>
            A venda foi finalizada com sucesso. Você pode imprimir o cupom para o cliente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-2 space-y-3 p-4 border rounded-md bg-muted/30">
          <div className="flex justify-between items-center">
            <span className="font-medium">Venda #:</span>
            <span>{sale?.id}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="font-bold">{formatCurrency(sale?.finalTotal)}</span>
          </div>
          
          {sale?.customer && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Cliente:</span>
              <span>{sale?.customer.name}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Forma de pagamento:</span>
            <span>
              {sale?.paymentMethod === 'mixed'
                ? 'Pagamento misto'
                : sale?.paymentMethod === 'credit_card'
                  ? 'Cartão de crédito'
                  : sale?.paymentMethod === 'debit_card'
                    ? 'Cartão de débito'
                    : sale?.paymentMethod === 'pix'
                      ? 'PIX'
                      : 'Dinheiro'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Qtd. itens:</span>
            <span>{sale?.items.reduce((total: number, item: any) => total + item.quantity, 0)}</span>
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 sm:space-x-0 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            <X className="mr-2 h-4 w-4" />
            Não Imprimir
          </Button>
          
          <Button 
            onClick={onPrint}
            className="flex-1 sm:flex-none"
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Cupom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
