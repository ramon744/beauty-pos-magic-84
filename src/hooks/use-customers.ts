
import { useState, useEffect, useCallback } from 'react';
import { Customer } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { toast } from '@/hooks/use-toast';

// Interface for customer data without ID and dates
interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address?: string;
  addressNumber?: string; // Added house/building number
  addressComplement?: string; // Added address complement
  cep?: string;
}

// CPF validation function
const validateCPF = (cpf: string): boolean => {
  // Remove any non-numeric characters
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Check if it has 11 digits
  if (cleanCPF.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Check first verification digit
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) return false;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  // Check second verification digit
  return parseInt(cleanCPF.charAt(10)) === secondDigit;
};

// CEP search function
const searchAddressByCEP = async (cep: string): Promise<{
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
} | null> => {
  if (!navigator.onLine) {
    throw new Error('Aplicativo está offline. Não é possível buscar CEP.');
  }
  
  if (!cep || cep.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw new Error('Falha ao buscar endereço pelo CEP');
  }
};

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Atualizar estado de online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Conexão perdida",
        description: "Você está offline. O aplicativo precisa de conexão com a internet para funcionar."
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load customers from Supabase and fallback to localStorage
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        if (isOnline) {
          // Try to load from Supabase
          const supabaseCustomers = await storageService.getFromSupabase<Customer>('customers');
          if (supabaseCustomers && supabaseCustomers.length > 0) {
            setCustomers(supabaseCustomers);
            // Update localStorage for compatibility
            storageService.setItem(STORAGE_KEYS.CUSTOMERS, supabaseCustomers);
          } else {
            // If no customers in Supabase, try localStorage
            const savedCustomers = storageService.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS);
            if (savedCustomers) {
              // Convert string dates back to Date objects
              const customersWithDates = savedCustomers.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                updatedAt: new Date(c.updatedAt)
              }));
              setCustomers(customersWithDates);
            }
          }
        } else {
          // If offline, try localStorage
          const savedCustomers = storageService.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS);
          if (savedCustomers) {
            const customersWithDates = savedCustomers.map((c: any) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt)
            }));
            setCustomers(customersWithDates);
          }
        }
      } catch (error) {
        console.error('Failed to load customers', error);
        setError('Falha ao carregar clientes');
        
        // Try localStorage as fallback
        const savedCustomers = storageService.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS);
        if (savedCustomers) {
          try {
            const customersWithDates = savedCustomers.map((c: any) => ({
              ...c,
              createdAt: new Date(c.createdAt),
              updatedAt: new Date(c.updatedAt)
            }));
            setCustomers(customersWithDates);
          } catch (parseError) {
            console.error('Failed to parse stored customers', parseError);
            setCustomers([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomers();
  }, [isOnline]);

  // Add a new customer
  const addCustomer = async (customerData: CustomerInput): Promise<Customer> => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível adicionar cliente offline."
      });
      throw new Error('Aplicativo está offline. Não é possível adicionar cliente.');
    }
    
    // Validate CPF
    if (!validateCPF(customerData.cpf)) {
      throw new Error('CPF inválido');
    }
    
    // Check if email or CPF already exists
    if (customerData.email && customers.some(c => c.email === customerData.email)) {
      throw new Error('Email já está em uso');
    }
    
    if (customers.some(c => c.cpf === customerData.cpf)) {
      throw new Error('CPF já está cadastrado');
    }
    
    try {
      const now = new Date();
      const newCustomer = {
        id: Date.now().toString(),
        ...customerData,
        createdAt: now,
        updatedAt: now,
      };
      
      // Salvar no Supabase
      const savedCustomer = await storageService.saveToSupabase('customers', newCustomer);
      
      // Atualizar estado local
      setCustomers(prevCustomers => [...prevCustomers, savedCustomer]);
      
      return savedCustomer;
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      toast({
        variant: "destructive",
        title: "Erro ao adicionar cliente",
        description: "Não foi possível adicionar o cliente. Tente novamente."
      });
      throw error;
    }
  };

  // Update an existing customer
  const updateCustomer = async (id: string, customerData: CustomerInput): Promise<Customer> => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível atualizar cliente offline."
      });
      throw new Error('Aplicativo está offline. Não é possível atualizar cliente.');
    }
    
    // Validate CPF
    if (!validateCPF(customerData.cpf)) {
      throw new Error('CPF inválido');
    }
    
    // Check if email already exists and belongs to a different customer
    if (customerData.email && customers.some(c => c.email === customerData.email && c.id !== id)) {
      throw new Error('Email já está em uso');
    }
    
    // Check if CPF already exists and belongs to a different customer
    if (customers.some(c => c.cpf === customerData.cpf && c.id !== id)) {
      throw new Error('CPF já está cadastrado');
    }
    
    try {
      const customerToUpdate = customers.find(c => c.id === id);
      if (!customerToUpdate) {
        throw new Error('Cliente não encontrado');
      }
      
      const updatedCustomer = { 
        ...customerToUpdate,
        ...customerData,
        updatedAt: new Date()
      };
      
      // Salvar no Supabase
      const savedCustomer = await storageService.saveToSupabase('customers', updatedCustomer);
      
      // Atualizar estado local
      setCustomers(prevCustomers => prevCustomers.map(c => c.id === id ? savedCustomer : c));
      
      return savedCustomer;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar cliente",
        description: "Não foi possível atualizar o cliente. Tente novamente."
      });
      throw error;
    }
  };

  // Remove a customer
  const removeCustomer = useCallback(async (id: string): Promise<boolean> => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível remover cliente offline."
      });
      throw new Error('Aplicativo está offline. Não é possível remover cliente.');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Remover do Supabase
      await storageService.removeFromSupabase('customers', id);
      
      // Atualizar estado local
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      
      return true;
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      setError('Erro ao remover cliente');
      
      toast({
        variant: "destructive",
        title: "Erro ao remover cliente",
        description: "Não foi possível remover o cliente. Tente novamente."
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [isOnline, setCustomers, setError, setLoading]);

  return {
    customers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    searchAddressByCEP,
    validateCPF,
    loading,
    error,
    isOnline
  };
}
