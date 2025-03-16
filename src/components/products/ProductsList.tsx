
import React, { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, BarChart2, Eye, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFetchProducts } from '@/hooks/use-products';
import { Product } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/formatters';

interface ProductsListProps {
  onEditProduct: (productId: string) => void;
}

export default function ProductsList({ onEditProduct }: ProductsListProps) {
  const { toast } = useToast();
  const { data: products, isLoading, error, refetch } = useFetchProducts();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      // In a real app, we would call an API to delete the product
      // For now, we'll just show a success toast
      toast({
        title: "Produto excluído",
        description: "O produto foi excluído com sucesso.",
      });
      
      // Refetch products to update the list
      await refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir produto",
        description: "Ocorreu um erro ao tentar excluir o produto.",
      });
    }
    
    setProductToDelete(null);
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
      accessorKey: "stock",
      header: "Estoque",
      cell: ({ row }) => {
        const stock = row.original.stock;
        let color = "text-green-600";
        
        if (stock <= 5) {
          color = "text-red-600";
        } else if (stock <= 20) {
          color = "text-amber-600";
        }
        
        return <span className={`font-medium ${color}`}>{stock}</span>;
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
                <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive text-destructive-foreground">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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
      <div className="rounded-md border shadow">
        <DataTable
          columns={columns}
          data={products || []}
          searchColumn="name"
          searchPlaceholder="Buscar produtos..."
        />
      </div>
    </div>
  );
}
