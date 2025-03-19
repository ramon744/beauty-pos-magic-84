
import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useFetchProducts, useDeleteProduct } from '@/hooks/use-products';
import { Product } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/formatters';
import { SearchBar } from './SearchBar';
import { StockStatus } from './StockStatus';
import { ProductActions } from './ProductActions';
import { ExpirationDate } from './ExpirationDate';
import { ProductDisplay } from './ProductDisplay';

interface ProductsListProps {
  onEditProduct: (productId: string) => void;
}

export default function ProductsList({ onEditProduct }: ProductsListProps) {
  const { toast } = useToast();
  const { data: products, isLoading, error, refetch } = useFetchProducts();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [deletionInProgress, setDeletionInProgress] = useState(false);
  
  // Effect to handle refetching after deletion
  useEffect(() => {
    if (deletionInProgress && !isDeleting) {
      // Small delay to ensure localStorage is updated before refetching
      const timer = setTimeout(() => {
        refetch();
        setDeletionInProgress(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [deletionInProgress, isDeleting, refetch]);
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setDeletionInProgress(true);
    
    deleteProduct(productToDelete, {
      onSuccess: () => {
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído com sucesso.",
        });
        
        setProductToDelete(null);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Erro ao excluir produto",
          description: "Ocorreu um erro ao tentar excluir o produto.",
        });
        
        setProductToDelete(null);
        setDeletionInProgress(false);
      }
    });
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "code",
      header: "Código",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.code}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nome do Produto",
      cell: ({ row }) => (
        <ProductDisplay name={row.original.name} image={row.original.image} />
      ),
    },
    {
      accessorKey: "category",
      header: "Categoria",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.category.name}</Badge>
      ),
    },
    {
      accessorKey: "expirationDate",
      header: "Data de Validade",
      cell: ({ row }) => (
        <ExpirationDate expirationDate={row.original.expirationDate} />
      ),
    },
    {
      accessorKey: "stock",
      header: "Estoque",
      cell: ({ row }) => (
        <StockStatus product={row.original} />
      ),
    },
    {
      accessorKey: "salePrice",
      header: "Preço de Venda",
      cell: ({ row }) => (
        <div className="font-medium">{formatCurrency(row.original.salePrice)}</div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <ProductActions
          productId={row.original.id}
          productName={row.original.name}
          onEditProduct={onEditProduct}
          isDeleting={isDeleting}
          onDeleteConfirm={handleDeleteProduct}
          isDeleteDialogOpen={productToDelete === row.original.id}
          setDeleteDialogOpen={(open) => {
            if (open) {
              setProductToDelete(row.original.id);
            } else {
              setProductToDelete(null);
            }
          }}
        />
      ),
    },
  ];

  // Filter products based on search input
  const filteredProducts = products ? products.filter(product => {
    if (!searchValue) return true;
    
    const searchLower = searchValue.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower)
    );
  }) : [];

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Erro ao carregar produtos. Por favor, tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar 
        searchValue={searchValue} 
        setSearchValue={setSearchValue} 
      />
      <div className="rounded-md border shadow">
        <DataTable
          columns={columns}
          data={filteredProducts}
          isLoading={isLoading || deletionInProgress}
        />
      </div>
    </div>
  );
}
