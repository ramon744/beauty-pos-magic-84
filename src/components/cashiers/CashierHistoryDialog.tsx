
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
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { formatCurrency } from '@/lib/formatters';
import { CashierOperation } from '@/services/cashier-operations-service';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircleIcon, ClockIcon, BanknoteIcon, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DayOperations {
  date: string;
  formattedDate: string;
  operations: CashierOperation[];
}

interface CashierHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
  cashierName: string;
  operations: CashierOperation[];
}

export const CashierHistoryDialog = ({
  isOpen,
  onClose,
  cashierId,
  cashierName,
  operations,
}: CashierHistoryDialogProps) => {
  const [groupedOperations, setGroupedOperations] = useState<DayOperations[]>([]);
  const { users } = useAuth();

  useEffect(() => {
    if (isOpen) {
      // Filter operations for this cashier and sort by date (newest first)
      const cashierOps = operations
        .filter(op => op.cashierId === cashierId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Group operations by day
      const opsByDay = new Map<string, CashierOperation[]>();
      
      cashierOps.forEach(op => {
        const date = new Date(op.timestamp);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!opsByDay.has(dateStr)) {
          opsByDay.set(dateStr, []);
        }
        
        opsByDay.get(dateStr)!.push(op);
      });
      
      // Convert map to array and sort by date (newest first)
      const groupedData: DayOperations[] = Array.from(opsByDay.entries())
        .map(([date, dayOps]) => ({
          date,
          formattedDate: format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
          operations: dayOps.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setGroupedOperations(groupedData);
    }
  }, [isOpen, cashierId, operations]);

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `ID: ${userId.substring(0, 6)}`;
  };

  const getOperationTypeBadge = (type: string) => {
    switch (type) {
      case 'open':
        return <Badge className="bg-green-500">Abertura</Badge>;
      case 'close':
        return <Badge className="bg-red-500">Fechamento</Badge>;
      case 'deposit':
        return <Badge className="bg-blue-500">Suprimento</Badge>;
      case 'withdrawal':
        return <Badge className="bg-amber-500">Sangria</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm:ss");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Histórico do Caixa: {cashierName}
          </DialogTitle>
          <DialogDescription>
            Histórico diário de operações e fechamentos
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {groupedOperations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma operação registrada para este caixa
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {groupedOperations.map((dayGroup) => {
                // Find opening and closing operations for this day
                const openOps = dayGroup.operations.filter(op => op.operationType === 'open');
                const closeOps = dayGroup.operations.filter(op => op.operationType === 'close');
                
                return (
                  <AccordionItem key={dayGroup.date} value={dayGroup.date}>
                    <AccordionTrigger className="hover:bg-muted px-4 rounded-md">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          <span>{dayGroup.formattedDate}</span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5 text-green-500" />
                            {openOps.length} aberturas
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5 text-red-500" />
                            {closeOps.length} fechamentos
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {dayGroup.operations.map((operation, index) => {
                        // Get previous and next operations to determine context
                        const isFirst = index === 0;
                        const isLast = index === dayGroup.operations.length - 1;
                        
                        // Special handling for closing operations with discrepancy
                        const hasDiscrepancy = operation.operationType === 'close' && 
                                              operation.discrepancyReason && 
                                              operation.closingBalance !== undefined && 
                                              operation.openingBalance !== undefined && 
                                              operation.closingBalance < operation.openingBalance;
                        
                        return (
                          <Card key={operation.id} className="mb-4 border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{formatTime(operation.timestamp)}</span>
                                  {getOperationTypeBadge(operation.operationType)}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(operation.amount)}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Operador: {getUserName(operation.userId)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Operation specific details */}
                              {operation.operationType === 'open' && (
                                <div className="text-sm border-t pt-2 mt-2">
                                  <div className="flex items-center gap-1 text-green-600">
                                    <BanknoteIcon className="h-4 w-4" />
                                    <span>Valor inicial: {formatCurrency(operation.amount)}</span>
                                  </div>
                                </div>
                              )}
                              
                              {operation.operationType === 'close' && (
                                <div className="text-sm border-t pt-2 mt-2">
                                  <div className="flex items-center gap-1">
                                    <BanknoteIcon className="h-4 w-4" />
                                    <span>Valor de fechamento: {formatCurrency(operation.amount)}</span>
                                  </div>
                                  
                                  {hasDiscrepancy && (
                                    <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-100">
                                      <div className="flex items-start gap-1 text-red-600 mb-1">
                                        <AlertCircleIcon className="h-4 w-4 mt-0.5" />
                                        <span className="font-medium">
                                          Quebra de caixa: {formatCurrency(operation.openingBalance - operation.closingBalance)}
                                        </span>
                                      </div>
                                      <div className="text-sm text-red-700">
                                        <p className="mb-1"><strong>Motivo:</strong> {operation.discrepancyReason}</p>
                                        <p><strong>Autorizado por:</strong> Gerente</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {(operation.operationType === 'deposit' || operation.operationType === 'withdrawal') && (
                                <div className="text-sm border-t pt-2 mt-2">
                                  {operation.reason && (
                                    <div className="italic text-muted-foreground">
                                      Motivo: {operation.reason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
