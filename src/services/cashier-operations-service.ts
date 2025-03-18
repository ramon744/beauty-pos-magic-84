
import { storageService, STORAGE_KEYS } from './storage-service';
import { cashierService } from './cashier-service';
import { toast } from 'sonner';

// CashierOperation interface
export interface CashierOperation {
  id: string;
  cashierId: string;
  userId: string;
  operationType: 'open' | 'close' | 'withdrawal' | 'deposit';
  amount: number;
  reason?: string;
  timestamp: Date;
  openingBalance?: number;
  closingBalance?: number;
}

// Initialize storage if empty
const initializeStorage = () => {
  if (!storageService.getItem<CashierOperation[]>(STORAGE_KEYS.CASHIER_OPERATIONS)) {
    storageService.setItem(STORAGE_KEYS.CASHIER_OPERATIONS, []);
  }
};

initializeStorage();

export const cashierOperationsService = {
  // Get all operations
  getOperations: (): CashierOperation[] => {
    return storageService.getItem<CashierOperation[]>(STORAGE_KEYS.CASHIER_OPERATIONS) || [];
  },

  // Get operations for a specific cashier
  getCashierOperations: (cashierId: string): CashierOperation[] => {
    const operations = cashierOperationsService.getOperations();
    return operations.filter(op => op.cashierId === cashierId);
  },

  // Get operations for a specific user
  getUserOperations: (userId: string): CashierOperation[] => {
    const operations = cashierOperationsService.getOperations();
    return operations.filter(op => op.userId === userId);
  },

  // Get most recent operation for a cashier
  getLatestCashierOperation: (cashierId: string): CashierOperation | null => {
    const operations = cashierOperationsService.getCashierOperations(cashierId);
    if (operations.length === 0) return null;
    
    // Sort by timestamp descending
    return operations.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  },
  
  // Check if a cashier is currently open
  isCashierOpen: (cashierId: string): boolean => {
    const latestOperation = cashierOperationsService.getLatestCashierOperation(cashierId);
    return latestOperation?.operationType === 'open';
  },
  
  // Get current balance for a cashier
  getCashierBalance: (cashierId: string): number => {
    const operations = cashierOperationsService.getCashierOperations(cashierId);
    
    let balance = 0;
    for (const op of operations) {
      switch (op.operationType) {
        case 'open':
          balance = op.amount;
          break;
        case 'close':
          balance = 0;
          break;
        case 'deposit':
          balance += op.amount;
          break;
        case 'withdrawal':
          balance -= op.amount;
          break;
      }
    }
    
    return balance;
  },

  // Open a cashier
  openCashier: (cashierId: string, userId: string, initialAmount: number): CashierOperation => {
    // Check if cashier exists
    const cashier = cashierService.getCashier(cashierId);
    if (!cashier) {
      throw new Error('Caixa não encontrado');
    }
    
    // Check if cashier is already open
    if (cashierOperationsService.isCashierOpen(cashierId)) {
      throw new Error('Este caixa já está aberto');
    }
    
    // Create operation
    const operation: CashierOperation = {
      id: crypto.randomUUID(),
      cashierId,
      userId,
      operationType: 'open',
      amount: initialAmount,
      timestamp: new Date(),
      openingBalance: initialAmount
    };
    
    // Save operation
    const operations = cashierOperationsService.getOperations();
    storageService.setItem(STORAGE_KEYS.CASHIER_OPERATIONS, [...operations, operation]);
    
    // Update cashier status
    cashierService.updateCashier(cashierId, { isActive: true });
    
    toast.success(`Caixa ${cashier.name} aberto com sucesso`);
    return operation;
  },

  // Close a cashier
  closeCashier: (cashierId: string, userId: string, finalAmount: number): CashierOperation => {
    // Check if cashier exists
    const cashier = cashierService.getCashier(cashierId);
    if (!cashier) {
      throw new Error('Caixa não encontrado');
    }
    
    // Check if cashier is open
    if (!cashierOperationsService.isCashierOpen(cashierId)) {
      throw new Error('Este caixa não está aberto');
    }
    
    // Calculate expected balance
    const expectedBalance = cashierOperationsService.getCashierBalance(cashierId);
    
    // Create operation
    const operation: CashierOperation = {
      id: crypto.randomUUID(),
      cashierId,
      userId,
      operationType: 'close',
      amount: finalAmount,
      timestamp: new Date(),
      closingBalance: finalAmount
    };
    
    // Save operation
    const operations = cashierOperationsService.getOperations();
    storageService.setItem(STORAGE_KEYS.CASHIER_OPERATIONS, [...operations, operation]);
    
    // Update cashier status
    cashierService.updateCashier(cashierId, { isActive: false });
    
    // Check for discrepancies
    if (finalAmount !== expectedBalance) {
      const difference = finalAmount - expectedBalance;
      const formattedDiff = Math.abs(difference).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      
      if (difference > 0) {
        toast.warning(`Diferença de caixa detectada: sobra de ${formattedDiff}`);
      } else {
        toast.warning(`Diferença de caixa detectada: falta de ${formattedDiff}`);
      }
    }
    
    toast.success(`Caixa ${cashier.name} fechado com sucesso`);
    return operation;
  },

  // Add deposit to cashier
  addDeposit: (cashierId: string, userId: string, amount: number, reason?: string): CashierOperation => {
    // Check if cashier exists
    const cashier = cashierService.getCashier(cashierId);
    if (!cashier) {
      throw new Error('Caixa não encontrado');
    }
    
    // Check if cashier is open
    if (!cashierOperationsService.isCashierOpen(cashierId)) {
      throw new Error('O caixa precisa estar aberto para fazer um suprimento');
    }
    
    // Create operation
    const operation: CashierOperation = {
      id: crypto.randomUUID(),
      cashierId,
      userId,
      operationType: 'deposit',
      amount,
      reason,
      timestamp: new Date()
    };
    
    // Save operation
    const operations = cashierOperationsService.getOperations();
    storageService.setItem(STORAGE_KEYS.CASHIER_OPERATIONS, [...operations, operation]);
    
    toast.success(`Suprimento de ${amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })} adicionado ao caixa ${cashier.name}`);
    return operation;
  },

  // Add withdrawal from cashier
  addWithdrawal: (cashierId: string, userId: string, amount: number, reason?: string): CashierOperation => {
    // Check if cashier exists
    const cashier = cashierService.getCashier(cashierId);
    if (!cashier) {
      throw new Error('Caixa não encontrado');
    }
    
    // Check if cashier is open
    if (!cashierOperationsService.isCashierOpen(cashierId)) {
      throw new Error('O caixa precisa estar aberto para fazer uma sangria');
    }
    
    // Check if there's enough balance
    const currentBalance = cashierOperationsService.getCashierBalance(cashierId);
    if (amount > currentBalance) {
      throw new Error('Saldo insuficiente para realizar esta sangria');
    }
    
    // Create operation
    const operation: CashierOperation = {
      id: crypto.randomUUID(),
      cashierId,
      userId,
      operationType: 'withdrawal',
      amount,
      reason,
      timestamp: new Date()
    };
    
    // Save operation
    const operations = cashierOperationsService.getOperations();
    storageService.setItem(STORAGE_KEYS.CASHIER_OPERATIONS, [...operations, operation]);
    
    toast.success(`Sangria de ${amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })} realizada no caixa ${cashier.name}`);
    return operation;
  }
};
