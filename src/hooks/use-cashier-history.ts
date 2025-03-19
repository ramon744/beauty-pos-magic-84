
import { useState, useEffect } from 'react';
import { CashierOperation } from '@/services/cashier-operations-service';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayOperations {
  date: string;
  formattedDate: string;
  operations: CashierOperation[];
}

export function useCashierHistory(
  isOpen: boolean,
  cashierId: string,
  operations: CashierOperation[]
) {
  const [groupedOperations, setGroupedOperations] = useState<DayOperations[]>([]);

  useEffect(() => {
    if (isOpen) {
      const cashierOps = operations
        .filter(op => op.cashierId === cashierId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const opsByDay = new Map<string, CashierOperation[]>();
      
      cashierOps.forEach(op => {
        const date = new Date(op.timestamp);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!opsByDay.has(dateStr)) {
          opsByDay.set(dateStr, []);
        }
        
        opsByDay.get(dateStr)!.push(op);
      });
      
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

  const calculateShortage = (operation: CashierOperation): number | null => {
    if (operation.operationType === 'close') {
      // If there's already a recorded discrepancy and manager approval
      if (operation.discrepancyReason && operation.openingBalance !== undefined) {
        return operation.openingBalance - operation.amount;
      }
      
      const openOp = findMatchingOpenOperation(operation);
      
      if (openOp && openOp.amount) {
        return operation.amount < openOp.amount ? openOp.amount - operation.amount : 0;
      }
      
      if (operation.openingBalance !== undefined && operation.closingBalance !== undefined) {
        return operation.openingBalance > operation.closingBalance ? 
          operation.openingBalance - operation.closingBalance : 0;
      }
    }
    return null;
  };

  const findMatchingOpenOperation = (closeOperation: CashierOperation): CashierOperation | null => {
    if (closeOperation.operationType !== 'close') return null;
    
    const cashierOps = operations.filter(op => op.cashierId === cashierId);
    
    const openOps = cashierOps
      .filter(op => 
        op.operationType === 'open' && 
        new Date(op.timestamp) < new Date(closeOperation.timestamp)
      )
      .sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    
    return openOps.length > 0 ? openOps[0] : null;
  };

  const hasDiscrepancy = (operation: CashierOperation): boolean => {
    if (operation.operationType === 'close') {
      if (operation.discrepancyReason) return true;
      
      const shortage = calculateShortage(operation);
      return shortage !== null && shortage > 0;
    }
    return false;
  };

  return {
    groupedOperations,
    calculateShortage,
    findMatchingOpenOperation,
    hasDiscrepancy
  };
}
