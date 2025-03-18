
import React, { useState, useEffect } from 'react';
import { Search, Barcode } from 'lucide-react';
import { CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface LabelsProductSearchProps {
  products: any[];
  onProductSelect: (product: any, quantity?: number) => void;
}

export const LabelsProductSearch: React.FC<LabelsProductSearchProps> = ({ products, onProductSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.code && product.code.includes(searchQuery))
      );
      
      setSearchResults(results);
      setHasSearched(true);
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchQuery, products]);

  const productColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Produto',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => row.original.code || '-',
    },
    {
      accessorKey: 'salePrice',
      header: 'Preço',
      cell: ({ row }) => (
        <div className="text-right">
          R$ {(row.original.salePrice || 0).toFixed(2)}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onProductSelect(row.original, 1)}
          >
            Selecionar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Buscar Produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {searchQuery.trim() && (
          <>
            {searchResults.length > 0 ? (
              <div className="rounded-md border">
                <DataTable
                  columns={productColumns}
                  data={searchResults}
                />
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum produto encontrado. Tente outra busca.
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  );
};
