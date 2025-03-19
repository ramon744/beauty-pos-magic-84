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

  // Load customers from localStorage on mount
  useEffect(() => {
    const savedCustomers = storageService.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS);
    if (savedCustomers) {
      try {
        // Convert string dates back to Date objects (if needed)
        const customersWithDates = savedCustomers.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }));
        setCustomers(customersWithDates);
      } catch (error) {
        console.error('Failed to parse stored customers', error);
        setCustomers([]);
      }
    }
  }, []);

  // Save customers to localStorage whenever they change
  useEffect(() => {
    if (customers.length > 0) {
      storageService.setItem(STORAGE_KEYS.CUSTOMERS, customers);
    }
  }, [customers]);

  // Add a new customer
  const addCustomer = async (customerData: CustomerInput): Promise<Customer> => {
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
    
    const now = new Date();
    const newCustomer = {
      id: Date.now().toString(),
      ...customerData,
      createdAt: now,
      updatedAt: now,
    };
    
    setCustomers(prevCustomers => [...prevCustomers, newCustomer]);
    return newCustomer;
  };

  // Update an existing customer
  const updateCustomer = async (id: string, customerData: CustomerInput): Promise<Customer> => {
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
    
    const updatedCustomers = customers.map(c => {
      if (c.id === id) {
        return { 
          ...c,
          ...customerData,
          updatedAt: new Date()
        };
      }
      return c;
    });
    
    setCustomers(updatedCustomers);
    const updatedCustomer = updatedCustomers.find(c => c.id === id);
    
    if (!updatedCustomer) {
      throw new Error('Cliente não encontrado');
    }
    
    return updatedCustomer;
  };

  // Remove a customer
  const removeCustomer = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      // Tente remover do Supabase primeiro
      const success = await storageService.removeFromSupabase('customers', id);
      
      if (success) {
        // Certifique-se de também remover do estado local
        setCustomers(prev => prev.filter(customer => customer.id !== id));
        
        // Se por algum motivo os dados persistirem no localStorage, forçamos a remoção aqui também
        const storageKey = STORAGE_KEYS.CUSTOMERS;
        const existingCustomers = storageService.getItem<Customer[]>(storageKey) || [];
        const updatedCustomers = existingCustomers.filter(c => c.id !== id);
        storageService.setItem(storageKey, updatedCustomers);
        
        return true;
      }
      
      throw new Error('Não foi possível remover o cliente');
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      setError('Erro ao remover cliente');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setCustomers, setError, setLoading]);

  return {
    customers,
    addCustomer,
    updateCustomer,
    removeCustomer,
    searchAddressByCEP,
    validateCPF,
    loading,
    error
  };
}
