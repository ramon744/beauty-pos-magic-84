
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Supplier } from '@/types';
import { storageService } from '@/services/storage-service';
import { supabase } from '@/integrations/supabase/client';

// Storage key for suppliers
const SUPPLIERS_STORAGE_KEY = 'suppliers';

// Initial mock data for development
const initialSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Distribuidora de Cosméticos ABC',
    phone: '(11) 3456-7890',
    email: 'contato@abccosmeticos.com.br',
    address: 'Rua das Flores, 123 - São Paulo/SP',
    contactPerson: 'João Silva',
    cnpj: '12.345.678/0001-90',
    createdAt: new Date(2022, 5, 15),
    updatedAt: new Date(2023, 2, 10),
  },
  {
    id: '2',
    name: 'Produtos de Beleza Ltda',
    phone: '(21) 9876-5432',
    email: 'vendas@produtosbeleza.com.br',
    address: 'Av. Rio Branco, 500 - Rio de Janeiro/RJ',
    contactPerson: 'Maria Oliveira',
    cnpj: '98.765.432/0001-21',
    createdAt: new Date(2022, 7, 20),
    updatedAt: new Date(2023, 1, 5),
  },
  {
    id: '3',
    name: 'Beauty Products S.A.',
    phone: '(31) 2345-6789',
    email: 'contato@beautyproducts.com.br',
    address: 'Av. Amazonas, 200 - Belo Horizonte/MG',
    contactPerson: 'Carlos Mendes',
    cnpj: '45.678.901/0001-23',
    createdAt: new Date(2022, 3, 10),
    updatedAt: new Date(2022, 11, 15),
  },
];

// Initialize suppliers in localStorage if not already set
const initializeSuppliers = () => {
  const storedSuppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY);
  if (!storedSuppliers) {
    storageService.setItem(SUPPLIERS_STORAGE_KEY, initialSuppliers);
    return initialSuppliers;
  }
  return storedSuppliers;
};

// Get all suppliers from Supabase with localStorage fallback
const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    // Try to get from Supabase first
    const { data, error } = await supabase.from('suppliers').select('*');
    
    if (error) {
      console.error("Error fetching suppliers from Supabase:", error);
      // Fallback to localStorage
      return storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || initializeSuppliers();
    }
    
    if (data && data.length > 0) {
      // Convert snake_case to camelCase
      const suppliers = data.map(item => ({
        id: item.id,
        name: item.name,
        phone: item.phone,
        email: item.email,
        address: item.address,
        contactPerson: item.contact_person,
        cnpj: item.cnpj,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
      
      // Also update localStorage
      storageService.setItem(SUPPLIERS_STORAGE_KEY, suppliers);
      
      return suppliers;
    } else {
      // No data in Supabase, use localStorage
      return storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || initializeSuppliers();
    }
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    // Fallback to localStorage on any error
    return storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || initializeSuppliers();
  }
};

// Hook for fetching all suppliers
export function useFetchSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      return getSuppliers();
    },
  });
}

// Hook for fetching a single supplier
export function useFetchSupplier(id: string) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      // Skip the request if id is empty
      if (!id) return null;
      
      try {
        // Try to get from Supabase first
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error("Error fetching supplier from Supabase:", error);
          // Fallback to localStorage
          const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
          const supplier = suppliers.find(s => s.id === id);
          if (!supplier) throw new Error('Fornecedor não encontrado');
          return supplier;
        }
        
        if (data) {
          // Convert snake_case to camelCase
          return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            contactPerson: data.contact_person,
            cnpj: data.cnpj,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
          };
        } else {
          // No data in Supabase, use localStorage
          const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
          const supplier = suppliers.find(s => s.id === id);
          if (!supplier) throw new Error('Fornecedor não encontrado');
          return supplier;
        }
      } catch (error) {
        console.error("Failed to fetch supplier:", error);
        // Fallback to localStorage on any error
        const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
        const supplier = suppliers.find(s => s.id === id);
        if (!supplier) throw new Error('Fornecedor não encontrado');
        return supplier;
      }
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

// Hook for saving a supplier (create or update)
export function useSaveSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: Supplier) => {
      try {
        // Prepare data for Supabase
        const supplierData = {
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          contact_person: supplier.contactPerson,
          cnpj: supplier.cnpj,
          created_at: supplier.createdAt.toISOString(),
          updated_at: supplier.updatedAt.toISOString()
        };
        
        // Try to save to Supabase
        const { data, error } = await supabase
          .from('suppliers')
          .upsert(supplierData)
          .select()
          .single();
        
        if (error) {
          console.error("Error saving supplier to Supabase:", error);
          
          // Fallback to localStorage
          const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
          const existingIndex = suppliers.findIndex(s => s.id === supplier.id);
          
          if (existingIndex >= 0) {
            // Update existing supplier
            suppliers[existingIndex] = supplier;
          } else {
            // Add new supplier
            suppliers.push(supplier);
          }
          
          // Save updated suppliers to localStorage
          storageService.setItem(SUPPLIERS_STORAGE_KEY, suppliers);
          
          return supplier;
        }
        
        // Convert snake_case back to camelCase
        const savedSupplier = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          contactPerson: data.contact_person,
          cnpj: data.cnpj,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
        
        // Also update localStorage for offline access
        const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
        const existingIndex = suppliers.findIndex(s => s.id === savedSupplier.id);
        
        if (existingIndex >= 0) {
          suppliers[existingIndex] = savedSupplier;
        } else {
          suppliers.push(savedSupplier);
        }
        
        storageService.setItem(SUPPLIERS_STORAGE_KEY, suppliers);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return savedSupplier;
      } catch (error) {
        console.error("Failed to save supplier:", error);
        
        // Fallback to localStorage on any error
        const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
        const existingIndex = suppliers.findIndex(s => s.id === supplier.id);
        
        if (existingIndex >= 0) {
          suppliers[existingIndex] = supplier;
        } else {
          suppliers.push(supplier);
        }
        
        storageService.setItem(SUPPLIERS_STORAGE_KEY, suppliers);
        
        return supplier;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Hook for deleting a supplier
export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplierId: string) => {
      try {
        // Try to delete from Supabase
        const { error } = await supabase
          .from('suppliers')
          .delete()
          .eq('id', supplierId);
        
        if (error) {
          console.error("Error deleting supplier from Supabase:", error);
          
          // Fallback to localStorage
          const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
          const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
          
          // Check if supplier was found and removed
          if (suppliers.length === updatedSuppliers.length) {
            throw new Error('Fornecedor não encontrado');
          }
          
          // Save updated suppliers to localStorage
          storageService.setItem(SUPPLIERS_STORAGE_KEY, updatedSuppliers);
          
          return supplierId;
        }
        
        // Also remove from localStorage for consistency
        const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
        const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
        storageService.setItem(SUPPLIERS_STORAGE_KEY, updatedSuppliers);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return supplierId;
      } catch (error) {
        console.error("Failed to delete supplier:", error);
        
        // Fallback to localStorage on any error
        const suppliers = storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || [];
        const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
        
        // Check if supplier was found and removed
        if (suppliers.length === updatedSuppliers.length) {
          throw new Error('Fornecedor não encontrado');
        }
        
        storageService.setItem(SUPPLIERS_STORAGE_KEY, updatedSuppliers);
        
        return supplierId;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
