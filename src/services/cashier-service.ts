
import { v4 as uuidv4 } from 'uuid';
import { Cashier, CashierOperation, CashierOperationType, User } from '@/types';
import { storageService, STORAGE_KEYS } from './storage-service';

// Chave para armazenar os dados no localStorage
const CASHIERS_KEY = STORAGE_KEYS.CASHIERS || 'cashiers';
const CASHIER_OPERATIONS_KEY = 'cashier_operations';

// Serviço para gerenciar caixas
export const cashierService = {
  // Obter todos os caixas
  getCashiers: (): Cashier[] => {
    return storageService.getItem<Cashier[]>(CASHIERS_KEY) || [];
  },

  // Obter caixas abertos
  getOpenCashiers: (): Cashier[] => {
    const cashiers = cashierService.getCashiers();
    return cashiers.filter(cashier => cashier.status === 'open');
  },

  // Obter caixas fechados
  getClosedCashiers: (): Cashier[] => {
    const cashiers = cashierService.getCashiers();
    return cashiers.filter(cashier => cashier.status === 'closed');
  },

  // Obter caixa por ID
  getCashierById: (id: string): Cashier | undefined => {
    const cashiers = cashierService.getCashiers();
    return cashiers.find(cashier => cashier.id === id);
  },

  // Abrir um novo caixa
  openCashier: (employee: User, initialAmount: number, registerNumber: string): Cashier => {
    const newCashier: Cashier = {
      id: uuidv4(),
      employeeId: employee.id,
      employeeName: employee.name,
      registerNumber,
      initialAmount,
      currentAmount: initialAmount,
      openedAt: new Date(),
      status: 'open'
    };

    const cashiers = cashierService.getCashiers();
    cashiers.push(newCashier);
    storageService.setItem(CASHIERS_KEY, cashiers);
    
    return newCashier;
  },

  // Fechar um caixa
  closeCashier: (id: string, finalAmount: number): Cashier | undefined => {
    const cashiers = cashierService.getCashiers();
    const cashierIndex = cashiers.findIndex(cashier => cashier.id === id);
    
    if (cashierIndex === -1) return undefined;
    
    const cashier = cashiers[cashierIndex];
    const difference = finalAmount - cashier.currentAmount;
    
    const updatedCashier: Cashier = {
      ...cashier,
      status: 'closed',
      closedAt: new Date(),
      difference
    };
    
    cashiers[cashierIndex] = updatedCashier;
    storageService.setItem(CASHIERS_KEY, cashiers);
    
    return updatedCashier;
  },

  // Obter todas as operações de um caixa
  getCashierOperations: (cashierId: string): CashierOperation[] => {
    const operations = storageService.getItem<CashierOperation[]>(CASHIER_OPERATIONS_KEY) || [];
    return operations.filter(op => op.cashierId === cashierId);
  },

  // Adicionar uma operação (sangria ou suprimento)
  addCashierOperation: (
    cashierId: string, 
    type: CashierOperationType, 
    amount: number, 
    reason: string, 
    userId: string
  ): CashierOperation => {
    // Criar a operação
    const newOperation: CashierOperation = {
      id: uuidv4(),
      cashierId,
      type,
      amount,
      reason,
      createdBy: userId,
      createdAt: new Date()
    };
    
    // Salvar a operação
    const operations = storageService.getItem<CashierOperation[]>(CASHIER_OPERATIONS_KEY) || [];
    operations.push(newOperation);
    storageService.setItem(CASHIER_OPERATIONS_KEY, operations);
    
    // Atualizar o valor atual do caixa
    const cashiers = cashierService.getCashiers();
    const cashierIndex = cashiers.findIndex(cashier => cashier.id === cashierId);
    
    if (cashierIndex !== -1) {
      const cashier = cashiers[cashierIndex];
      const newAmount = type === 'deposit' 
        ? cashier.currentAmount + amount 
        : cashier.currentAmount - amount;
      
      cashiers[cashierIndex] = {
        ...cashier,
        currentAmount: newAmount
      };
      
      storageService.setItem(CASHIERS_KEY, cashiers);
    }
    
    return newOperation;
  }
};
