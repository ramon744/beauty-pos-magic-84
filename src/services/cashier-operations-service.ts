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
  discrepancyReason?: string; // Field for shortage reason
  managerName?: string; // Added field for manager who authorized the discrepancy
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
  
  // Get current balance for a cashier, including sales
  getCashierBalance: (cashierId: string): number => {
    const operations = cashierOperationsService.getCashierOperations(cashierId);
    
    // If no operations, return 0
    if (operations.length === 0) return 0;
    
    // Sort operations by timestamp
    const sortedOperations = operations.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Find the most recent 'open' operation
    const openOperationIndex = sortedOperations
      .map(op => op.operationType)
      .lastIndexOf('open');
    
    // If no open operation, return 0
    if (openOperationIndex === -1) return 0;
    
    let balance = 0;
    
    // Calculate balance from operations after the last 'open'
    for (let i = openOperationIndex; i < sortedOperations.length; i++) {
      const op = sortedOperations[i];
      
      switch (op.operationType) {
        case 'open':
          balance = op.amount;
          break;
        case 'close':
          return 0; // After close, balance is 0
        case 'deposit':
          balance += op.amount;
          break;
        case 'withdrawal':
          balance -= op.amount;
          break;
      }
    }
    
    // If cashier is open, add sales amounts
    if (cashierOperationsService.isCashierOpen(cashierId)) {
      // Get the timestamp of the last open operation
      const lastOpenOp = operations
        .filter(op => op.operationType === 'open')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (lastOpenOp) {
        const openTime = new Date(lastOpenOp.timestamp).getTime();
        const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
        
        // Only consider cash payments to affect the cash balance
        orders.forEach(order => {
          const orderTime = new Date(order.createdAt).getTime();
          if (orderTime >= openTime) {
            // For mixed payments, only add cash portion
            if (order.paymentMethod === 'mixed' && order.paymentDetails.payments) {
              order.paymentDetails.payments.forEach((payment: any) => {
                if (payment.method === 'cash') {
                  balance += payment.amount;
                }
              });
            } 
            // For single cash payment
            else if (order.paymentMethod === 'cash') {
              balance += order.finalTotal;
            }
          }
        });
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
  closeCashier: (cashierId: string, userId: string, finalAmount: number, discrepancyReason?: string, managerName?: string): CashierOperation => {
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
    
    // Add discrepancy reason if provided (when amount is less than expected)
    if (finalAmount < expectedBalance && discrepancyReason) {
      operation.discrepancyReason = discrepancyReason;
      operation.managerName = managerName; // Add the manager name to the operation
    }
    
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
