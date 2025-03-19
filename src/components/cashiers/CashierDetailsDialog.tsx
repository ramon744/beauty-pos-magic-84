
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { CashierOperation } from '@/services/cashier-operations-service';
import { FileIcon, PieChartIcon, TableIcon } from 'lucide-react';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { ScrollArea } from '@/components/ui/scroll-area';

// Default payment methods with zero values
const DEFAULT_PAYMENT_METHODS = [
  { method: 'Dinheiro', amount: 0, color: '#16a34a' },
  { method: 'Cartão de Crédito', amount: 0, color: '#2563eb' },
  { method: 'Cartão de Débito', amount: 0, color: '#9333ea' },
  { method: 'Pix', amount: 0, color: '#eab308' },
];

interface PaymentMethodSummary {
  method: string;
  amount: number;
  color: string;
}

interface CashierDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
  cashierName: string;
  operations: CashierOperation[];
}

export const CashierDetailsDialog = ({
  isOpen,
  onClose,
  cashierId,
  cashierName,
  operations,
}: CashierDetailsDialogProps) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>(DEFAULT_PAYMENT_METHODS);

  // Load payment data when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Start with default zero values
      const methodsMap = new Map<string, PaymentMethodSummary>();
      
      DEFAULT_PAYMENT_METHODS.forEach(method => {
        methodsMap.set(method.method, {...method, amount: 0});
      });
      
      // Get all orders from storage
      const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
      
      // Find latest open operation for this cashier
      const latestOpenOp = operations
        .filter(op => op.cashierId === cashierId && op.operationType === 'open')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (latestOpenOp) {
        const openTimestamp = new Date(latestOpenOp.timestamp).getTime();
        const cashierUserId = latestOpenOp.userId;
        
        // Filter sales by date and cashier operator
        const cashierOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt).getTime();
          // Check if order is after cashier opening AND either matches userId OR seller.id
          return orderDate >= openTimestamp && 
                 (order.userId === cashierUserId || 
                 (order.seller && order.seller.id === cashierUserId));
        });
        
        console.log('Found cashier orders:', cashierOrders.length, 'for cashier user:', cashierUserId);
        
        // Process each order's payment data
        cashierOrders.forEach(order => {
          if (order.paymentMethod === 'mixed' && order.paymentDetails && order.paymentDetails.payments) {
            // Handle mixed payments
            order.paymentDetails.payments.forEach((payment: any) => {
              const methodName = getMethodDisplayName(payment.method);
              if (methodsMap.has(methodName)) {
                const current = methodsMap.get(methodName)!;
                methodsMap.set(methodName, {
                  ...current,
                  amount: current.amount + payment.amount
                });
              }
            });
          } else if (order.paymentDetails && order.paymentMethod) {
            // Handle single payment method
            const methodName = getMethodDisplayName(order.paymentMethod);
            if (methodsMap.has(methodName)) {
              const current = methodsMap.get(methodName)!;
              methodsMap.set(methodName, {
                ...current,
                amount: current.amount + order.finalTotal
              });
            }
          }
        });
      }
      
      // Convert map back to array
      setPaymentMethods(Array.from(methodsMap.values()));
    }
  }, [isOpen, cashierId, operations]);

  // Helper function to convert payment method codes to display names
  const getMethodDisplayName = (methodCode: string): string => {
    switch (methodCode) {
      case 'cash':
        return 'Dinheiro';
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'debit_card':
        return 'Cartão de Débito';
      case 'pix':
        return 'Pix';
      default:
        return methodCode;
    }
  };

  // Calculate total amount
  const totalAmount = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  
  // Find the opening balance from operations
  const openingOperation = operations
    .filter(op => op.cashierId === cashierId && op.operationType === 'open')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  
  const openingBalance = openingOperation?.amount || 0;
  const operatorName = openingOperation ? 
    `Operador: ${openingOperation.userName || 'ID: ' + openingOperation.userId.substring(0, 6)}` : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes do Caixa: {cashierName}</DialogTitle>
          <DialogDescription>
            Visualização detalhada de operações e formas de pagamento
            {operatorName && <div className="mt-1 font-medium text-sm">{operatorName}</div>}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-1">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="summary">
                  <PieChartIcon className="h-4 w-4 mr-2" /> Resumo de Pagamentos
                </TabsTrigger>
                <TabsTrigger value="operations">
                  <FileIcon className="h-4 w-4 mr-2" /> Operações do Caixa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">Formas de Pagamento</h3>
                        <div className="mb-4">
                          <div className="flex justify-between items-center text-muted-foreground mb-1">
                            <span>Valor da abertura: </span>
                            <span className="font-semibold">{formatCurrency(openingBalance)}</span>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Método</TableHead>
                              <TableHead>Valor</TableHead>
                              <TableHead>%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentMethods.map((method) => (
                              <TableRow key={method.method}>
                                <TableCell className="font-medium">{method.method}</TableCell>
                                <TableCell>{formatCurrency(method.amount)}</TableCell>
                                <TableCell>
                                  {totalAmount > 0 
                                    ? ((method.amount / totalAmount) * 100).toFixed(1) 
                                    : '0.0'}%
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow>
                              <TableCell className="font-bold">Total</TableCell>
                              <TableCell className="font-bold">{formatCurrency(totalAmount)}</TableCell>
                              <TableCell>100%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <h3 className="text-lg font-medium mb-4">Distribuição de Pagamentos</h3>
                        <div className="w-full h-[200px]">
                          {totalAmount > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={paymentMethods.filter(method => method.amount > 0)}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={70}
                                  fill="#8884d8"
                                  dataKey="amount"
                                  nameKey="method"
                                  label={({ method, percent }) => 
                                    `${method}: ${(percent * 100).toFixed(0)}%`
                                  }
                                >
                                  {paymentMethods.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                              Não há pagamentos registrados ainda
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="operations" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Histórico de Operações</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operations.filter(op => op.cashierId === cashierId).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              Nenhuma operação registrada para este caixa
                            </TableCell>
                          </TableRow>
                        ) : (
                          operations
                            .filter(op => op.cashierId === cashierId)
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((operation) => (
                              <TableRow key={operation.id}>
                                <TableCell>
                                  {new Date(operation.timestamp).toLocaleTimeString('pt-BR')}
                                </TableCell>
                                <TableCell>
                                  {operation.operationType === 'open' && 'Abertura'}
                                  {operation.operationType === 'close' && 'Fechamento'}
                                  {operation.operationType === 'deposit' && 'Suprimento'}
                                  {operation.operationType === 'withdrawal' && 'Sangria'}
                                </TableCell>
                                <TableCell>{formatCurrency(operation.amount)}</TableCell>
                                <TableCell>{operation.userName || 'ID: ' + operation.userId.substring(0, 6)}</TableCell>
                                <TableCell>{operation.reason || '-'}</TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-6">
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
