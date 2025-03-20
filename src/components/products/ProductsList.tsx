
import React, { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, BarChart2, Eye, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFetchProducts, useDeleteProduct } from '@/hooks/use-products';
import { Product } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/formatters';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { format } from 'date-fns';

interface ProductsListProps {
  onEditProduct: (productId: string) => void;
}

export default function ProductsList({ onEditProduct }: ProductsListProps) {
  const { toast } = useToast();
  const { data: products, isLoading, error } = useFetchProducts();
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
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
      }
    });
  };

  // Helper function to determine stock status
  const getStockStatus = (product: Product) => {
    const { stock, minimumStock } = product;
    
    if (stock === 0) {
      return { status: 'outOfStock', label: 'Esgotado', color: 'text-red-600' };
    }
    
    if (minimumStock && stock <= minimumStock) {
      return { status: 'belowMinimum', label: 'Abaixo do Mínimo', color: 'text-red-600' };
    }
    
    if (minimumStock && stock <= minimumStock * 1.5) {
      return { status: 'nearMinimum', label: 'Próximo do Mínimo', color: 'text-amber-600' };
    }
    
    return { status: 'inStock', label: 'Em Estoque', color: 'text-green-600' };
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
        <div className="flex items-center gap-2">
          {row.original.image ? (
            <img
              src={row.original.image}
              alt={row.original.name}
              className="h-8 w-8 rounded-md object-cover"
            />
          ) : (
            <Package className="h-8 w-8 text-muted-foreground" />
          )}
          <span>{row.original.name}</span>
        </div>
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
      cell: ({ row }) => {
        const expirationDate = row.original.expirationDate;
        if (!expirationDate) return <span className="text-muted-foreground">Não definida</span>;
        
        const today = new Date();
        const expDate = new Date(expirationDate);
        const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let badgeVariant = "outline";
        if (daysUntilExpiration <= 0) {
          badgeVariant = "destructive";
        } else if (daysUntilExpiration <= 30) {
          badgeVariant = "warning";
        }
        
        return (
          <Badge variant={badgeVariant as any}>
            {format(expDate, "dd/MM/yyyy")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "stock",
      header: "Estoque",
      cell: ({ row }) => {
        const product = row.original;
        const stockStatus = getStockStatus(product);
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${stockStatus.color}`}>
              {product.stock}
            </span>
            {(stockStatus.status === 'belowMinimum' || stockStatus.status === 'nearMinimum') && (
              <div className="relative" title={stockStatus.label}>
                <AlertTriangle className={`h-4 w-4 ${stockStatus.status === 'belowMinimum' ? 'text-red-600' : 'text-amber-600'}`} />
                {product.minimumStock && (
                  <span className="text-xs text-muted-foreground ml-1">
                    Min: {product.minimumStock}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      },
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEditProduct(row.original.id)}
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog open={productToDelete === row.original.id} onOpenChange={(open) => !open && setProductToDelete(null)}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setProductToDelete(row.original.id)}
                title="Excluir"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto 
                  "{row.original.name}" e removerá os dados associados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteProduct} 
                  className="bg-destructive text-destructive-foreground"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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

  const clearSearch = () => {
    setSearchValue('');
  };

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Erro ao carregar produtos. Por favor, tente novamente mais tarde.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar por código ou nome do produto..."
            className="pl-8 pr-8"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {searchValue && (
            <button 
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="rounded-md border shadow">
        <DataTable
          columns={columns}
          data={filteredProducts}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
