
import { useQuery } from '@tanstack/react-query';
import { cashierOperationsService, CashierOperation } from '@/services/cashier-operations-service';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { format, isAfter, isBefore, isEqual, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { User } from '@/types';

interface CashierOperationsReportData {
  operations: CashierOperation[];
  totalOperations: number;
  totalAmount: number;
  averageTicket?: number;
  shortages?: {
    operationId: string;
    amount: number;
    reason: string;
    timestamp: string;
    managerId: string;
    managerName: string;
  }[];
}

// Helper function to check if a date is within a range
const isWithinRange = (date: Date, range?: DateRange): boolean => {
  if (!range?.from) return true;
  
  const dateToCheck = new Date(date);
  
  if (range.to) {
    // If there's an end date, check if the date is between the start and end dates
    const endDate = new Date(range.to);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    
    return (
      (isAfter(dateToCheck, range.from) || isEqual(dateToCheck, range.from)) && 
      (isBefore(dateToCheck, endDate) || isEqual(dateToCheck, endDate))
    );
  }
  
  // If there's only a start date, check if the date is after or equal to it
  return isAfter(dateToCheck, range.from) || isEqual(dateToCheck, range.from);
};

export function useCashierOperationsReport(
  dateRange?: DateRange,
  operatorId: string = 'all',
  reportType: 'operations' | 'closings' | 'shortages' | 'sales' = 'operations'
) {
  return useQuery({
    queryKey: ['cashier-report', reportType, dateRange?.from?.toISOString(), dateRange?.to?.toISOString(), operatorId],
    queryFn: () => {
      // Get all operations
      const allOperations = cashierOperationsService.getOperations();
      
      // Get users to populate userName - fix TypeScript error by adding proper type annotation
      const users = storageService.getItem<User[]>(STORAGE_KEYS.USERS) || [];
      
      // Filter operations by date range and operator
      let filteredOperations = allOperations.filter(op => {
        const opDate = new Date(op.timestamp);
        const isInRange = isWithinRange(opDate, dateRange);
        const isMatchingOperator = operatorId === 'all' || op.userId === operatorId;
        
        return isInRange && isMatchingOperator;
      });
      
      // Add userName to operations
      filteredOperations = filteredOperations.map(op => {
        const user = users.find((u) => u.id === op.userId);
        return {
          ...op,
          userName: user?.name || undefined
        };
      });
      
      // Further filter based on report type
      switch (reportType) {
        case 'closings':
          filteredOperations = filteredOperations.filter(op => op.operationType === 'close');
          break;
        case 'shortages':
          // Shortages are close operations with a discrepancy reason (indicating a shortage)
          filteredOperations = filteredOperations.filter(op => 
            op.operationType === 'close' && op.discrepancyReason && op.discrepancyReason.trim() !== ''
          );
          
          // Calculate shortage amount and update each operation
          filteredOperations = filteredOperations.map(op => {
            // Calculate the difference between opening balance and closing amount
            let shortageAmount = 0;
            if (op.openingBalance !== undefined && op.amount !== undefined) {
              shortageAmount = op.openingBalance - op.amount;
            }
            
            return {
              ...op,
              isShortage: true,
              // Store the shortage amount temporarily in the amount field for display purposes
              originalAmount: op.amount, // Store the original amount
              amount: shortageAmount > 0 ? shortageAmount : 0, // Only positive shortages
              reason: op.discrepancyReason || '' // Ensure reason is set from discrepancyReason
            };
          });
          break;
        case 'sales':
          // For sales, we need to get all orders within the date range by the operator
          const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
          
          // Filter sales by date range and operator
          const filteredSales = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const isInRange = isWithinRange(orderDate, dateRange);
            const isMatchingOperator = operatorId === 'all' || 
                                      (order.userId === operatorId) || 
                                      (order.seller && order.seller.id === operatorId);
            
            return isInRange && isMatchingOperator;
          });
          
          // Convert sales to operations format for the table
          filteredOperations = filteredSales.map(sale => ({
            id: sale.id,
            timestamp: sale.createdAt,
            cashierId: sale.cashierId || '',
            userId: sale.seller?.id || sale.userId || '',
            userName: sale.seller?.name || '', // Add user name from seller info
            operationType: 'sale' as const,
            amount: sale.finalTotal || 0,
            reason: '', // No reason for sales
            managerName: sale.discountAuthorizedBy?.name || '', // Add manager name if available
            managerId: sale.discountAuthorizedBy?.id || '',
          }));
          break;
      }
      
      // Sort operations by date (newest first)
      const sortedOperations = [...filteredOperations].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Calculate totals
      const totalAmount = reportType === 'shortages' 
        ? sortedOperations.reduce((total, op) => total + (op.amount || 0), 0)
        : sortedOperations.reduce((total, op) => total + op.amount, 0);
      
      // Prepare report data
      const reportData: CashierOperationsReportData = {
        operations: sortedOperations,
        totalOperations: sortedOperations.length,
        totalAmount,
      };
      
      // Add report-type specific data
      if (reportType === 'shortages') {
        reportData.shortages = sortedOperations.map(op => ({
          operationId: op.id,
          amount: op.amount, // This is now the shortage amount
          reason: op.discrepancyReason || op.reason || '',
          timestamp: op.timestamp instanceof Date 
            ? op.timestamp.toISOString() 
            : (typeof op.timestamp === 'string' ? op.timestamp : new Date().toISOString()),
          managerId: op.managerId || '',
          managerName: op.managerName || '',
        }));
      }
      
      if (reportType === 'sales') {
        reportData.averageTicket = sortedOperations.length > 0 
          ? totalAmount / sortedOperations.length 
          : 0;
      }
      
      return reportData;
    },
    enabled: !!(dateRange?.from && dateRange?.to), // Only run query if date range is set
  });
}
