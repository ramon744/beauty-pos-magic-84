
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
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { formatCurrency } from '@/lib/formatters';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrintReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  sale: any | null;
}

// Add a proper type for the printer
interface PrinterConfig {
  id: string;
  name: string;
  isDefault: boolean;
  width: string;
  deviceName?: string;
  isNetworkPrinter: boolean;
  ipAddress?: string;
  port?: string;
}

export const PrintReceiptDialog: React.FC<PrintReceiptDialogProps> = ({
  isOpen,
  onClose,
  onPrint,
  sale
}) => {
  if (!sale) return null;
  
  // Get default printer with proper type annotation
  const printers = storageService.getItem<PrinterConfig[]>(STORAGE_KEYS.PRINTERS) || [];
  const defaultPrinter = printers.find((p) => p.isDefault);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR') + ' ' + new Date(date).toLocaleTimeString('pt-BR');
  };
  
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito', 
      'pix': 'PIX',
      'cash': 'Dinheiro',
      'mixed': 'Pagamento Misto'
    };
    return methods[method] || method;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Deseja imprimir o cupom?</DialogTitle>
          <DialogDescription>
            A venda foi finalizada com sucesso. Você pode imprimir o cupom para o cliente.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 my-3">
          <div className="bg-white p-6 border rounded-md shadow-sm font-mono text-sm">
            {/* Receipt Header */}
            <div className="text-center mb-4">
              <h3 className="font-bold">Natura Essencia</h3>
              <p className="text-xs">CNPJ: 12.345.678/0001-90</p>
              <p className="text-xs">Rua Exemplo, 123 - Centro</p>
              <p className="text-xs">Tel: (11) 9876-5432</p>
            </div>
            
            <div className="border-t border-dashed my-3"></div>
            
            {/* Receipt Info */}
            <div>
              <p className="font-bold">RECIBO DE VENDA #{sale.id}</p>
              <p className="text-xs">Data: {formatDate(sale.createdAt)}</p>
              {sale.customer && <p className="text-xs">Cliente: {sale.customer.name}</p>}
              <p className="text-xs">Vendedor: {sale.seller?.name || 'Não identificado'}</p>
            </div>
            
            <div className="border-t border-dashed my-3"></div>
            
            {/* Receipt Items */}
            <p className="font-bold">ITENS</p>
            {sale.items && sale.items.map((item: any, index: number) => (
              <div key={index} className="my-1">
                <div className="flex justify-between">
                  <span>{item.quantity}x {item.product?.name || item.name}</span>
                  <span>{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                </div>
                <p className="text-xs text-gray-600">
                  {formatCurrency(item.price || 0)} cada
                </p>
              </div>
            ))}
            
            <div className="border-t border-dashed my-3"></div>
            
            {/* Receipt Totals */}
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(sale.total || 0)}</span>
            </div>
            
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <span>Desconto:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            
            {sale.discountReason && (
              <p className="text-xs">Motivo: {sale.discountReason}</p>
            )}
            
            <div className="flex justify-between font-bold mt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(sale.finalTotal || 0)}</span>
            </div>
            
            <div className="border-t border-dashed my-3"></div>
            
            {/* Payment Method */}
            <p className="font-bold">FORMA DE PAGAMENTO</p>
            
            {sale.paymentMethod === 'mixed' && sale.paymentDetails?.payments ? (
              <>
                {sale.paymentDetails.payments.map((payment: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between">
                      <span>{getPaymentMethodName(payment.method)}:</span>
                      <span>{formatCurrency(payment.amount || 0)}</span>
                    </div>
                    
                    {payment.method === 'credit_card' && payment.installments > 1 && (
                      <p className="text-xs">
                        {payment.installments}x de {formatCurrency((payment.amount || 0) / payment.installments)}
                      </p>
                    )}
                    
                    {payment.method === 'cash' && payment.change && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span>Recebido:</span>
                          <span>{formatCurrency(payment.cashReceived || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Troco:</span>
                          <span>{formatCurrency(payment.change || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>{getPaymentMethodName(sale.paymentMethod)}:</span>
                  <span>{formatCurrency(sale.finalTotal || 0)}</span>
                </div>
                
                {sale.paymentMethod === 'credit_card' && 
                 sale.paymentDetails?.installments > 1 && (
                  <p className="text-xs">
                    {sale.paymentDetails.installments}x de {formatCurrency((sale.finalTotal || 0) / sale.paymentDetails.installments)}
                  </p>
                )}
                
                {sale.paymentMethod === 'cash' && 
                 sale.paymentDetails?.change && (
                  <>
                    <div className="flex justify-between text-xs">
                      <span>Recebido:</span>
                      <span>{formatCurrency(sale.paymentDetails.cashReceived || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Troco:</span>
                      <span>{formatCurrency(sale.paymentDetails.change || 0)}</span>
                    </div>
                  </>
                )}
              </>
            )}
            
            <div className="border-t border-dashed my-3"></div>
            
            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-xs">Obrigado pela preferência!</p>
              <p className="text-xs">Natura Essencia - Beleza e Saúde</p>
            </div>
          </div>
        </ScrollArea>
        
        {!defaultPrinter && (
          <div className="text-sm text-amber-600 mt-2 p-2 border border-amber-200 bg-amber-50 rounded-md">
            Nenhuma impressora padrão configurada. Configure uma impressora nas configurações do sistema.
          </div>
        )}
        
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
            disabled={!defaultPrinter}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Cupom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
