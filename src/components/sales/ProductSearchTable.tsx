
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Product } from '@/types';

interface ProductSearchTableProps {
  searchResults: Product[];
  addProductToCart: (product: Product, qty: number) => void;
}

export const ProductSearchTable: React.FC<ProductSearchTableProps> = ({ 
  searchResults, 
  addProductToCart 
}) => {
  const productColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Produto',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'salePrice',
      header: 'Preço',
      cell: ({ row }) => (
        <div className="text-right">R$ {row.original.salePrice.toFixed(2)}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addProductToCart(row.original, 1)}
            className="text-primary hover:text-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-md border">
      <DataTable
        columns={productColumns}
        data={searchResults}
      />
    </div>
  );
};
