
import { useState, useEffect, useCallback } from 'react';
import { cashierOperationsService, CashierOperation } from '@/services/cashier-operations-service';
import { useAuth } from '@/contexts/AuthContext';
import { cashierService } from '@/services/cashier-service';
import { toast } from '@/hooks/use-toast';

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
  const closeCashier = useCallback(async (cashierId: string, finalAmount: number) => {
    if (!user) {
      toast({ title: 'Usuário não autenticado', variant: 'destructive' });
      return null;
    }
    
    try {
      setError(null);
      const operation = cashierOperationsService.closeCashier(cashierId, user.id, finalAmount);
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
    isCashierOpen: cashierOperationsService.isCashierOpen,
    getCashierBalance: cashierOperationsService.getCashierBalance,
    getLatestCashierOperation: cashierOperationsService.getLatestCashierOperation
  };
}
