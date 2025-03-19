import { Cashier, User } from '@/types';
import { storageService, STORAGE_KEYS } from './storage-service';
import { toast } from 'sonner';

// Initialize storage if empty
const initializeStorage = () => {
  if (!storageService.getItem<Cashier[]>(STORAGE_KEYS.CASHIERS)) {
    storageService.setItem(STORAGE_KEYS.CASHIERS, []);
  }
  if (!storageService.getItem(STORAGE_KEYS.CASHIER_ASSIGNMENTS)) {
    storageService.setItem(STORAGE_KEYS.CASHIER_ASSIGNMENTS, {});
  }
};

// Ensure initialization runs when the module is loaded
initializeStorage();

export const cashierService = {
  // Get all cashiers
  getCashiers: (): Cashier[] => {
    const cashiers = storageService.getItem<Cashier[]>(STORAGE_KEYS.CASHIERS);
    // If null is returned, initialize with empty array and return
    if (!cashiers) {
      storageService.setItem(STORAGE_KEYS.CASHIERS, []);
      return [];
    }
    return cashiers;
  },

  // Get a specific cashier by ID
  getCashier: (id: string): Cashier | undefined => {
    const cashiers = cashierService.getCashiers();
    return cashiers.find(cashier => cashier.id === id);
  },

  // Create a new cashier
  createCashier: (cashier: Omit<Cashier, 'id' | 'createdAt' | 'updatedAt'>): Cashier => {
    const cashiers = cashierService.getCashiers();
    
    // Check if a cashier with the same register number already exists
    if (cashiers.some(c => c.registerNumber === cashier.registerNumber)) {
      throw new Error('Um caixa com esse número de registro já existe');
    }
    
    const newCashier: Cashier = {
      ...cashier,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedCashiers = [...cashiers, newCashier];
    storageService.setItem(STORAGE_KEYS.CASHIERS, updatedCashiers);
    
    // Add console log for debugging
    console.log('Cashier created:', newCashier);
    console.log('Updated cashiers:', updatedCashiers);
    
    return newCashier;
  },

  // Update an existing cashier with improved logging
  updateCashier: (id: string, updates: Partial<Omit<Cashier, 'id' | 'createdAt'>>): Cashier => {
    const cashiers = cashierService.getCashiers();
    const index = cashiers.findIndex(c => c.id === id);
    
    if (index === -1) {
      throw new Error('Caixa não encontrado');
    }
    
    // Check if register number is being changed and if it conflicts
    if (updates.registerNumber && 
        updates.registerNumber !== cashiers[index].registerNumber && 
        cashiers.some(c => c.id !== id && c.registerNumber === updates.registerNumber)) {
      throw new Error('Um caixa com esse número de registro já existe');
    }
    
    // Log previous state for debugging
    console.log(`Updating cashier ${id}:`, {
      before: cashiers[index],
      updates
    });
    
    const updatedCashier: Cashier = {
      ...cashiers[index],
      ...updates,
      updatedAt: new Date()
    };
    
    // Explicitly set isActive if it's in the updates
    if (updates.isActive !== undefined) {
      console.log(`Setting cashier ${id} isActive to:`, updates.isActive);
      // Double check to make sure the value is explicitly set
      updatedCashier.isActive = updates.isActive;
    }
    
    cashiers[index] = updatedCashier;
    storageService.setItem(STORAGE_KEYS.CASHIERS, cashiers);
    
    // Log the updated cashier for verification
    console.log('Cashier updated:', updatedCashier);
    
    return updatedCashier;
  },

  // Delete a cashier
  deleteCashier: (id: string): boolean => {
    const cashiers = cashierService.getCashiers();
    const filteredCashiers = cashiers.filter(c => c.id !== id);
    
    if (filteredCashiers.length === cashiers.length) {
      return false; // No cashier was removed
    }
    
    // Remove any assignments for this cashier
    cashierService.unassignCashier(id);
    
    storageService.setItem(STORAGE_KEYS.CASHIERS, filteredCashiers);
    
    // Add console log for debugging
    console.log('Cashier deleted, remaining cashiers:', filteredCashiers);
    
    return true;
  },

  // Assign a cashier to a user
  assignCashierToUser: (cashierId: string, userId: string, userName: string): void => {
    const cashiers = cashierService.getCashiers();
    const cashier = cashiers.find(c => c.id === cashierId);
    
    if (!cashier) {
      throw new Error('Caixa não encontrado');
    }
    
    // Check if this cashier is already assigned to someone else
    if (cashier.assignedUserId && cashier.assignedUserId !== userId) {
      throw new Error('Este caixa já está atribuído a outro usuário');
    }
    
    // Update the cashier with user assignment
    cashierService.updateCashier(cashierId, { 
      assignedUserId: userId,
      assignedUserName: userName,
      isActive: true
    });
    
    // Add console log for debugging
    console.log(`Cashier ${cashier.name} assigned to user ${userName}`);
    
    toast.success(`Caixa ${cashier.name} vinculado com sucesso`);
  },

  // Unassign a cashier from any user
  unassignCashier: (cashierId: string): void => {
    const cashiers = cashierService.getCashiers();
    const cashier = cashiers.find(c => c.id === cashierId);
    
    if (!cashier) {
      return;
    }
    
    cashierService.updateCashier(cashierId, { 
      assignedUserId: undefined,
      assignedUserName: undefined
    });
    
    // Add console log for debugging
    console.log(`Cashier ${cashier.name} unassigned`);
  },

  // Get cashier assigned to a specific user
  getUserCashier: (userId: string): Cashier | undefined => {
    const cashiers = cashierService.getCashiers();
    return cashiers.find(c => c.assignedUserId === userId);
  },

  // Get all available (unassigned) cashiers
  getAvailableCashiers: (): Cashier[] => {
    const cashiers = cashierService.getCashiers();
    return cashiers.filter(c => !c.assignedUserId);
  }
};
