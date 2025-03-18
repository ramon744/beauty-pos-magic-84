import { useState, useEffect, useCallback } from 'react';
import { cashierOperationsService, CashierOperation } from '@/services/cashier-operations-service';
import { useAuth } from '@/contexts/AuthContext';
import { cashierService } from '@/services/cashier-service';
import { toast } from '@/hooks/use-toast';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

export function useCashierOperations() {
  const [operations, setOperations] = useState<CashierOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load all operations
  const loadOperations = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const data = cashierOperationsService.getOperations();
      setOperations(data);
    } catch (err) {
      setError('Erro ao carregar operações de caixa');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load operations for the current user
  const loadUserOperations = useCallback(() => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = cashierOperationsService.getUserOperations(user.id);
      setOperations(data);
    } catch (err) {
      setError('Erro ao carregar operações de caixa do usuário');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Open a cashier
  const openCashier = useCallback(async (cashierId: string, initialAmount: number) => {
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      return null;
    }
    
    try {
      setError(null);
      const operation = cashierOperationsService.openCashier(cashierId, user.id, initialAmount);
      loadOperations();
      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao abrir caixa';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [user, loadOperations]);

  // Close a cashier
  const closeCashier = useCallback(async (cashierId: string, finalAmount: number, discrepancyReason?: string) => {
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      return null;
    }
    
    try {
      setError(null);
      const operation = cashierOperationsService.closeCashier(cashierId, user.id, finalAmount, discrepancyReason);
      loadOperations();
      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fechar caixa';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [user, loadOperations]);

  // Add deposit to cashier
  const addDeposit = useCallback(async (cashierId: string, amount: number, reason?: string) => {
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      return null;
    }
    
    try {
      setError(null);
      const operation = cashierOperationsService.addDeposit(cashierId, user.id, amount, reason);
      loadOperations();
      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar suprimento';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [user, loadOperations]);

  // Add withdrawal from cashier
  const addWithdrawal = useCallback(async (cashierId: string, amount: number, reason?: string) => {
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      return null;
    }
    
    try {
      setError(null);
      const operation = cashierOperationsService.addWithdrawal(cashierId, user.id, amount, reason);
      loadOperations();
      return operation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao realizar sangria';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  }, [user, loadOperations]);

  // Get user's assigned cashier and its status
  const getUserCashierStatus = useCallback(() => {
    if (!user) return { cashier: null, isOpen: false, balance: 0 };
    
    const cashier = cashierService.getUserCashier(user.id);
    if (!cashier) return { cashier: null, isOpen: false, balance: 0 };
    
    const isOpen = cashierOperationsService.isCashierOpen(cashier.id);
    const balance = cashierOperationsService.getCashierBalance(cashier.id);
    
    return { cashier, isOpen, balance };
  }, [user]);

  // Calculate total sales for a cashier
  const getCashierSalesTotal = useCallback((cashierId: string): number => {
    // Get all orders
    const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
    
    // Find the latest opening operation for this cashier
    const latestOpenOp = operations
      .filter(op => op.cashierId === cashierId && op.operationType === 'open')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (!latestOpenOp) return 0;
    
    const openingTimestamp = new Date(latestOpenOp.timestamp).getTime();
    
    // Calculate total sales since the cashier was opened
    let totalSales = 0;
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).getTime();
      if (orderDate >= openingTimestamp) {
        totalSales += order.finalTotal;
      }
    });
    
    return totalSales;
  }, [operations]);

  // Get payment method breakdown
  const getCashierPaymentBreakdown = useCallback((cashierId: string) => {
    // Define default payment methods
    const methodsMap = new Map<string, number>();
    methodsMap.set('cash', 0);
    methodsMap.set('credit_card', 0);
    methodsMap.set('debit_card', 0);
    methodsMap.set('pix', 0);
    
    // Get all orders
    const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
    
    // Find latest open operation
    const latestOpenOp = operations
      .filter(op => op.cashierId === cashierId && op.operationType === 'open')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (!latestOpenOp) return Object.fromEntries(methodsMap);
    
    const openingTimestamp = new Date(latestOpenOp.timestamp).getTime();
    
    // Process each order
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).getTime();
      if (orderDate >= openingTimestamp) {
        if (order.paymentMethod === 'mixed' && order.paymentDetails.payments) {
          // Handle mixed payments
          order.paymentDetails.payments.forEach((payment: any) => {
            const method = payment.method;
            methodsMap.set(method, (methodsMap.get(method) || 0) + payment.amount);
          });
        } else {
          // Handle single payment method
          const method = order.paymentMethod;
          methodsMap.set(method, (methodsMap.get(method) || 0) + order.finalTotal);
        }
      }
    });
    
    return Object.fromEntries(methodsMap);
  }, [operations]);

  // Load operations on component mount
  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  return {
    operations,
    isLoading,
    error,
    openCashier,
    closeCashier,
    addDeposit,
    addWithdrawal,
    loadOperations,
    loadUserOperations,
    getUserCashierStatus,
    getCashierSalesTotal,
    getCashierPaymentBreakdown,
    isCashierOpen: cashierOperationsService.isCashierOpen,
    getCashierBalance: cashierOperationsService.getCashierBalance,
    getLatestCashierOperation: cashierOperationsService.getLatestCashierOperation
  };
}
