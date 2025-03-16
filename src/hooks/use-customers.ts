
import { useState, useEffect } from 'react';
import { Customer } from '@/types';
import { storageKeys } from '@/contexts/AuthContext';

// Interface for customer data without ID and dates
interface CustomerInput {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load customers from localStorage on mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem(storageKeys.CUSTOMERS);
    if (savedCustomers) {
      try {
        const parsedCustomers = JSON.parse(savedCustomers);
        // Convert string dates back to Date objects
        const customersWithDates = parsedCustomers.map((c: any) => ({
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
      localStorage.setItem(storageKeys.CUSTOMERS, JSON.stringify(customers));
    }
  }, [customers]);

  // Add a new customer
  const addCustomer = async (customerData: CustomerInput): Promise<Customer> => {
    // Check if email or CPF already exists
    if (customers.some(c => c.email === customerData.email)) {
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
    // Check if email already exists and belongs to a different customer
    if (customers.some(c => c.email === customerData.email && c.id !== id)) {
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
  const removeCustomer = async (id: string): Promise<boolean> => {
    setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== id));
    return true;
  };

  return {
    customers,
    addCustomer,
    updateCustomer,
    removeCustomer
  };
};
