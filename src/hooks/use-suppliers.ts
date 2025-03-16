
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Supplier } from '@/types';

// Mock data for development
const mockSuppliers: Supplier[] = [
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

// Hook for fetching all suppliers
export function useFetchSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      // In a real app, we would fetch from an API
      return mockSuppliers;
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
      
      // In a real app, we would fetch from an API
      const supplier = mockSuppliers.find(s => s.id === id);
      if (!supplier) throw new Error('Supplier not found');
      
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
      // In a real app, we would call an API
      console.log('Saving supplier:', supplier);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return supplier;
    },
    onSuccess: () => {
      // Invalidate queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
