
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Cashier, CashierOperation } from '@/types';
import { cashierService } from '@/services/cashier-service';
import { useCashier } from '@/hooks/use-cashier';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

interface CashierDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashier: Cashier | null;
}

const CashierDetailsDialog: React.FC<CashierDetailsDialogProps> = ({ 
  open, 
  onOpenChange,
  cashier
}) => {
  const [operations, setOperations] = useState<CashierOperation[]>([]);
  const { formatDateTime, formatCurrency } = useCashier();
  
  useEffect(() => {
    if (cashier && open) {
      const cashierOperations = cashierService.getCashierOperations(cashier.id);
      setOperations(cashierOperations);
    }
  }, [cashier, open]);
  
  if (!cashier) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Caixa</DialogTitle>
          <DialogDescription>
            {cashier.registerNumber} - {cashier.employeeName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Valor Inicial</span>
                  <span className="text-lg font-semibold">{formatCurrency(cashier.initialAmount)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Valor Final</span>
                  <span className="text-lg font-semibold">
                    {cashier.status === 'closed' 
                      ? formatCurrency(cashier.currentAmount)
                      : formatCurrency(cashier.currentAmount) + ' (Em aberto)'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Abertura</span>
                  <span className="text-lg font-semibold">{formatDateTime(cashier.openedAt)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Fechamento</span>
                  <span className="text-lg font-semibold">
                    {cashier.closedAt ? formatDateTime(cashier.closedAt) : 'Em aberto'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            {cashier.status === 'closed' && cashier.difference !== undefined && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Diferença</span>
                    <span className={`text-lg font-semibold ${
                      cashier.difference !== 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {formatCurrency(cashier.difference)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <h3 className="text-lg font-semibold mt-4">Operações de Caixa</h3>
          
          {operations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operations.map((operation) => (
                  <TableRow key={operation.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {operation.type === 'withdrawal' ? (
                          <ArrowUpRight className="mr-2 text-red-500" size={18} />
                        ) : (
                          <ArrowDownLeft className="mr-2 text-green-500" size={18} />
                        )}
                        {operation.type === 'withdrawal' ? 'Sangria' : 'Suprimento'}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(operation.amount)}</TableCell>
                    <TableCell>{operation.reason}</TableCell>
                    <TableCell>{formatDateTime(operation.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma operação registrada.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashierDetailsDialog;
