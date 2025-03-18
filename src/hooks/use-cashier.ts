
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { cashierService } from '@/services/cashier-service';
import { useAuth } from '@/contexts/AuthContext';
import { Cashier, CashierOperationType } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useCashier = () => {
  const [openCashiers, setOpenCashiers] = useState<Cashier[]>([]);
  const [closedCashiers, setClosedCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredClosedCashiers, setFilteredClosedCashiers] = useState<Cashier[]>([]);
  const [filters, setFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    employeeId: 'all'
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Carregar dados iniciais
  const loadCashiers = useCallback(() => {
    setLoading(true);
    try {
      const open = cashierService.getOpenCashiers();
      const closed = cashierService.getClosedCashiers();
      
      setOpenCashiers(open);
      setClosedCashiers(closed);
      setFilteredClosedCashiers(closed);
    } catch (error) {
      console.error('Erro ao carregar caixas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos caixas.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  // Carregar dados ao montar o componente
  useEffect(() => {
    loadCashiers();
  }, [loadCashiers]);
  
  // Filtrar caixas fechados
  const filterClosedCashiers = useCallback(() => {
    if (!closedCashiers.length) return;
    
    try {
      let filtered = [...closedCashiers];
      
      // Filtrar por data
      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(cashier => {
          const closedDate = new Date(cashier.closedAt || cashier.openedAt);
          return closedDate >= startDate && closedDate <= endDate;
        });
      }
      
      // Filtrar por funcionário
      if (filters.employeeId !== 'all') {
        filtered = filtered.filter(cashier => cashier.employeeId === filters.employeeId);
      }
      
      setFilteredClosedCashiers(filtered);
    } catch (error) {
      console.error('Erro ao filtrar caixas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aplicar os filtros.',
        variant: 'destructive'
      });
    }
  }, [closedCashiers, filters, toast]);
  
  // Aplicar filtros quando os filtros mudarem
  useEffect(() => {
    filterClosedCashiers();
  }, [filters, filterClosedCashiers]);
  
  // Abrir um novo caixa
  const openCashier = useCallback(
    (initialAmount: number, registerNumber: string) => {
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para abrir um caixa.',
          variant: 'destructive'
        });
        return null;
      }
      
      try {
        const newCashier = cashierService.openCashier(user, initialAmount, registerNumber);
        setOpenCashiers(prev => [...prev, newCashier]);
        
        toast({
          title: 'Sucesso',
          description: `Caixa ${registerNumber} aberto com sucesso.`
        });
        
        return newCashier;
      } catch (error) {
        console.error('Erro ao abrir caixa:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível abrir o caixa.',
          variant: 'destructive'
        });
        return null;
      }
    },
    [user, toast]
  );
  
  // Fechar um caixa
  const closeCashier = useCallback(
    (cashierId: string, finalAmount: number) => {
      try {
        const closedCashier = cashierService.closeCashier(cashierId, finalAmount);
        
        if (!closedCashier) {
          toast({
            title: 'Erro',
            description: 'Caixa não encontrado.',
            variant: 'destructive'
          });
          return false;
        }
        
        // Atualizar listas
        setOpenCashiers(prev => prev.filter(c => c.id !== cashierId));
        setClosedCashiers(prev => [...prev, closedCashier]);
        setFilteredClosedCashiers(prev => [...prev, closedCashier]);
        
        toast({
          title: 'Sucesso',
          description: `Caixa ${closedCashier.registerNumber} fechado com sucesso.`
        });
        
        return true;
      } catch (error) {
        console.error('Erro ao fechar caixa:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível fechar o caixa.',
          variant: 'destructive'
        });
        return false;
      }
    },
    [toast]
  );
  
  // Realizar operação (sangria ou suprimento)
  const performOperation = useCallback(
    (cashierId: string, type: CashierOperationType, amount: number, reason: string) => {
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado para realizar esta operação.',
          variant: 'destructive'
        });
        return false;
      }
      
      try {
        cashierService.addCashierOperation(cashierId, type, amount, reason, user.id);
        
        // Recarregar os caixas para atualizar os valores
        loadCashiers();
        
        const operationName = type === 'withdrawal' ? 'Sangria' : 'Suprimento';
        toast({
          title: 'Sucesso',
          description: `${operationName} de caixa realizado com sucesso.`
        });
        
        return true;
      } catch (error) {
        console.error(`Erro ao realizar ${type}:`, error);
        toast({
          title: 'Erro',
          description: 'Não foi possível realizar a operação.',
          variant: 'destructive'
        });
        return false;
      }
    },
    [user, toast, loadCashiers]
  );
  
  // Formatar data
  const formatDateTime = (date: Date | string | undefined): string => {
    if (!date) return '-';
    return format(new Date(date), 'HH:mm - dd/MM/yyyy', { locale: ptBR });
  };
  
  // Formatar valor
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return {
    openCashiers,
    closedCashiers: filteredClosedCashiers,
    loading,
    filters,
    setFilters,
    openCashier,
    closeCashier,
    performOperation,
    formatDateTime,
    formatCurrency,
    loadCashiers
  };
};
