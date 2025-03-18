
import { useState, useEffect, useCallback } from 'react';
import { Cashier, User } from '@/types';
import { cashierService } from '@/services/cashier-service';
import { toast } from 'sonner';

export function useCashiers() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all cashiers
  const loadCashiers = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      const data = cashierService.getCashiers();
      console.log('Loaded cashiers:', data); // Add debugging log
      setCashiers(data || []);
    } catch (err) {
      setError('Erro ao carregar lista de caixas');
      toast.error('Erro ao carregar caixas');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new cashier
  const createCashier = useCallback(
    async (data: Omit<Cashier, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setError(null);
        const newCashier = cashierService.createCashier(data);
        setCashiers((prev) => [...prev, newCashier]);
        toast.success('Caixa criado com sucesso');
        return newCashier;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar caixa';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  // Update an existing cashier
  const updateCashier = useCallback(
    async (id: string, data: Partial<Omit<Cashier, 'id' | 'createdAt'>>) => {
      try {
        setError(null);
        const updatedCashier = cashierService.updateCashier(id, data);
        setCashiers((prev) =>
          prev.map((cashier) => (cashier.id === id ? updatedCashier : cashier))
        );
        toast.success('Caixa atualizado com sucesso');
        return updatedCashier;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar caixa';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  // Delete a cashier
  const deleteCashier = useCallback(async (id: string) => {
    try {
      setError(null);
      const success = cashierService.deleteCashier(id);
      if (success) {
        setCashiers((prev) => prev.filter((cashier) => cashier.id !== id));
        toast.success('Caixa removido com sucesso');
      }
      return success;
    } catch (err) {
      setError('Erro ao remover caixa');
      toast.error('Erro ao remover caixa');
      throw err;
    }
  }, []);

  // Assign a cashier to a user
  const assignCashierToUser = useCallback(
    async (cashierId: string, userId: string, userName: string) => {
      try {
        setError(null);
        cashierService.assignCashierToUser(cashierId, userId, userName);
        loadCashiers(); // Reload cashiers to reflect assignment
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao vincular caixa';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    [loadCashiers]
  );

  // Unassign a cashier
  const unassignCashier = useCallback(
    async (cashierId: string) => {
      try {
        setError(null);
        cashierService.unassignCashier(cashierId);
        loadCashiers(); // Reload cashiers to reflect unassignment
        toast.success('Vinculação removida com sucesso');
        return true;
      } catch (err) {
        setError('Erro ao desvincular caixa');
        toast.error('Erro ao desvincular caixa');
        throw err;
      }
    },
    [loadCashiers]
  );

  // Load cashiers on component mount
  useEffect(() => {
    loadCashiers();
  }, [loadCashiers]);

  return {
    cashiers,
    isLoading,
    error,
    createCashier,
    updateCashier,
    deleteCashier,
    assignCashierToUser,
    unassignCashier,
    loadCashiers,
    getAvailableCashiers: cashierService.getAvailableCashiers,
    getUserCashier: cashierService.getUserCashier,
  };
}
