
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

// Simulated data for payment methods
// In a real app, this would come from an API or service
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSummary[]>([]);

  // Calculate payment methods summary (this is simulated)
  useEffect(() => {
    // In a real implementation, you would fetch this data from your payment service
    // Here we're just creating simulated data
    const methods: PaymentMethodSummary[] = [
      { method: 'Dinheiro', amount: 845.50, color: '#16a34a' },
      { method: 'Cartão de Crédito', amount: 1250.75, color: '#2563eb' },
      { method: 'Cartão de Débito', amount: 620.25, color: '#9333ea' },
      { method: 'Pix', amount: 980.00, color: '#eab308' },
    ];
    
    setPaymentMethods(methods);
  }, [cashierId]);

  const totalAmount = paymentMethods.reduce((sum, method) => sum + method.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Caixa: {cashierName}</DialogTitle>
          <DialogDescription>
            Visualização detalhada de operações e formas de pagamento
          </DialogDescription>
        </DialogHeader>

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
                              {((method.amount / totalAmount) * 100).toFixed(1)}%
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
                    <div className="w-full h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethods}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
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
                            <TableCell>Usuário ID: {operation.userId.substring(0, 6)}</TableCell>
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

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
