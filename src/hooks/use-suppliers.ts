
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Supplier } from '@/types';
import { storageService } from '@/services/storage-service';

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

// Get all suppliers from localStorage
const getSuppliers = (): Supplier[] => {
  return storageService.getItem<Supplier[]>(SUPPLIERS_STORAGE_KEY) || initializeSuppliers();
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
      
      // Get supplier from localStorage
      const suppliers = getSuppliers();
      const supplier = suppliers.find(s => s.id === id);
      if (!supplier) throw new Error('Fornecedor não encontrado');
      
      return supplier;
    },
    enabled: !!id, // Only run the query if id is provided
  });
}

// Hook for saving a supplier (create or update)
export function useSaveSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (supplier: Supplier) => {
      // Get current suppliers from localStorage
      const suppliers = getSuppliers();
      
      // Check if supplier already exists (update) or is new (create)
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return supplier;
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
      // Get current suppliers from localStorage
      const suppliers = getSuppliers();
      
      // Filter out the supplier to delete
      const updatedSuppliers = suppliers.filter(s => s.id !== supplierId);
      
      // Check if supplier was found and removed
      if (suppliers.length === updatedSuppliers.length) {
        throw new Error('Fornecedor não encontrado');
      }
      
      // Save updated suppliers to localStorage
      storageService.setItem(SUPPLIERS_STORAGE_KEY, updatedSuppliers);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return supplierId;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
