
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
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

interface ProductsListProps {
  onEditProduct: (productId: string) => void;
}

export default function ProductsList({ onEditProduct }: ProductsListProps) {
  const { toast } = useToast();
  const { data: products, isLoading, error, refetch } = useFetchProducts();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [deletionInProgress, setDeletionInProgress] = useState(false);
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>([]);
  
  // On component mount, load deleted IDs from localStorage
  useEffect(() => {
    console.log('ProductsList mounted or route changed, refetching data');
    refetch();
    
    // Get deleted IDs from localStorage
    const deletedIds = JSON.parse(localStorage.getItem('deletedProductIds') || '[]');
    setDeletedProductIds(deletedIds);
  }, [refetch]);
  
  // Save deleted product IDs to localStorage when they change
  useEffect(() => {
    if (deletedProductIds.length > 0) {
      localStorage.setItem('deletedProductIds', JSON.stringify(deletedProductIds));
    }
  }, [deletedProductIds]);
  
  // Effect to handle refetching after deletion
  useEffect(() => {
    if (deletionInProgress && !isDeleting) {
      // Small delay to ensure localStorage is updated before refetching
      const timer = setTimeout(() => {
        console.log('Deletion completed, refetching products');
        refetch();
        setDeletionInProgress(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [deletionInProgress, isDeleting, refetch]);
  
  // Filter products based on search input and exclude deleted products
  useEffect(() => {
    if (products) {
      // Filter out already deleted products
      const availableProducts = products.filter(product => 
        !deletedProductIds.includes(product.id)
      );
      
      const filtered = availableProducts.filter(product => {
        if (!searchValue) return true;
        
        const searchLower = searchValue.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.code.toLowerCase().includes(searchLower)
        );
      });
      
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [products, searchValue, deletedProductIds]);
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setDeletionInProgress(true);
    
    // Add this product to our deleted products list
    setDeletedProductIds(prev => [...prev, productToDelete]);
    
    // Immediately remove the product from filtered list
    setFilteredProducts(prev => prev.filter(p => p.id !== productToDelete));
    
    // Force removal from localStorage first for immediate UI update
    const localProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
    const updatedProducts = localProducts.filter(p => p.id !== productToDelete);
    storageService.setItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
    
    deleteProduct(productToDelete, {
      onSuccess: () => {
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído com sucesso.",
        });
        
        setProductToDelete(null);
        
        // Verify the product is truly gone from localStorage after deletion
        const verifyProducts = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
        if (verifyProducts.some(p => p.id === productToDelete)) {
          console.warn("Product still exists in localStorage after deletion, forcing removal");
          const forceRemoval = verifyProducts.filter(p => p.id !== productToDelete);
          storageService.setItem(STORAGE_KEYS.PRODUCTS, forceRemoval);
        }
        
        // Store the deleted ID in localStorage for persistence across refreshes
        const deletedIds = JSON.parse(localStorage.getItem('deletedProductIds') || '[]');
        if (!deletedIds.includes(productToDelete)) {
          deletedIds.push(productToDelete);
          localStorage.setItem('deletedProductIds', JSON.stringify(deletedIds));
        }
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Erro ao excluir produto",
          description: "Ocorreu um erro ao tentar excluir o produto.",
        });
        
        // On error, remove from deletedProductIds to allow it to show again
        setDeletedProductIds(prev => prev.filter(id => id !== productToDelete));
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
      cell: ({ row }) => {
        // Garantir que category existe antes de acessar name
        const categoryName = row.original.category?.name || 'Sem categoria';
        return <Badge variant="outline">{categoryName}</Badge>;
      },
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
          isDeleting={isDeleting && productToDelete === row.original.id}
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
