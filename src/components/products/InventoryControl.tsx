
import React, { useState } from 'react';
import { useFetchProducts, useSaveProduct } from '@/hooks/use-products';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, AlertTriangle, CheckCircle, PackageCheck, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const InventoryControl = () => {
  const { data: products, isLoading } = useFetchProducts();
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { mutate: saveProduct } = useSaveProduct();
  const { toast } = useToast();

  // Filter products based on search and status filter
  const filteredProducts = products ? products.filter(product => {
    // Apply search filter
    if (searchValue && 
        !product.name.toLowerCase().includes(searchValue.toLowerCase()) &&
        !product.code.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    switch(statusFilter) {
      case 'out-of-stock':
        return product.stock === 0;
      case 'low-stock':
        return product.minimumStock !== undefined && 
               product.stock > 0 && 
               product.stock <= product.minimumStock;
      case 'warning-stock':
        return product.minimumStock !== undefined && 
               product.stock > product.minimumStock && 
               product.stock <= (product.minimumStock * 1.5);
      case 'healthy-stock':
        return !product.minimumStock || 
               (product.stock > (product.minimumStock * 1.5));
      default:
        return true;
    }
  }) : [];

  const clearSearch = () => {
    setSearchValue('');
  };

  // Function to handle stock adjustments
  const handleStockAdjustment = (product: Product, adjustment: number) => {
    const newStock = product.stock + adjustment;
    
    // Prevent negative stock
    if (newStock < 0) {
      toast({
        variant: "destructive",
        title: "Operação inválida",
        description: "O estoque não pode ficar negativo.",
      });
      return;
    }
    
    const updatedProduct = {
      ...product,
      stock: newStock,
      updatedAt: new Date()
    };
    
    saveProduct(updatedProduct, {
      onSuccess: () => {
        toast({
          title: "Estoque atualizado",
          description: `Estoque do produto ${product.name} atualizado para ${newStock} unidades.`,
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Ocorreu um erro ao atualizar o estoque.",
        });
      }
    });
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!products) return { outOfStock: 0, lowStock: 0, warningStock: 0, healthyStock: 0 };
    
    const stats = {
      outOfStock: products.filter(p => p.stock === 0).length,
      lowStock: products.filter(p => p.minimumStock !== undefined && p.stock > 0 && p.stock <= p.minimumStock).length,
      warningStock: products.filter(p => p.minimumStock !== undefined && p.stock > p.minimumStock && p.stock <= (p.minimumStock * 1.5)).length,
      healthyStock: products.filter(p => !p.minimumStock || (p.stock > (p.minimumStock * 1.5))).length
    };
    
    return stats;
  };

  const stats = calculateStats();

  // Table columns
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
        <div>{row.original.name}</div>
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
      header: "Estoque Atual",
      cell: ({ row }) => {
        const product = row.original;
        const { stock, minimumStock } = product;
        
        let statusColor = "text-green-600";
        let statusIcon = null;
        
        if (stock === 0) {
          statusColor = "text-red-600";
          statusIcon = <AlertTriangle className="h-4 w-4 text-red-600 ml-1" />;
        } else if (minimumStock && stock <= minimumStock) {
          statusColor = "text-red-600";
          statusIcon = <AlertTriangle className="h-4 w-4 text-red-600 ml-1" />;
        } else if (minimumStock && stock <= minimumStock * 1.5) {
          statusColor = "text-amber-600";
          statusIcon = <AlertTriangle className="h-4 w-4 text-amber-600 ml-1" />;
        } else {
          statusIcon = <CheckCircle className="h-4 w-4 text-green-600 ml-1" />;
        }
        
        return (
          <div className="flex items-center">
            <span className={`font-medium ${statusColor}`}>{stock}</span>
            {statusIcon}
            {minimumStock && (
              <span className="text-xs text-muted-foreground ml-2">
                Min: {minimumStock}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Ajustar Estoque",
      cell: ({ row }) => {
        const product = row.original;
        
        return (
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleStockAdjustment(product, -1)}
              disabled={product.stock <= 0}
              title="Reduzir estoque"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Input
              type="number"
              value={product.stock}
              disabled
              className="w-16 text-center"
            />
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleStockAdjustment(product, 1)}
              title="Aumentar estoque"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${stats.outOfStock > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.outOfStock}
            </div>
            <CardDescription>
              produtos esgotados
            </CardDescription>
          </CardContent>
        </Card>

        <Card className={`${stats.lowStock > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abaixo do Mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowStock}
            </div>
            <CardDescription>
              produtos em estado crítico
            </CardDescription>
          </CardContent>
        </Card>

        <Card className={`${stats.warningStock > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Próximo do Mínimo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.warningStock}
            </div>
            <CardDescription>
              produtos em alerta
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Saudável</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.healthyStock}
            </div>
            <CardDescription>
              produtos com estoque adequado
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {(stats.outOfStock > 0 || stats.lowStock > 0) && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Alerta:</span> Você tem {stats.outOfStock + stats.lowStock} produto(s) com estoque crítico que precisam de atenção.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="out-of-stock" className="text-red-600">Sem Estoque</TabsTrigger>
          <TabsTrigger value="low-stock" className="text-red-600">Abaixo do Mínimo</TabsTrigger>
          <TabsTrigger value="warning-stock" className="text-amber-600">Próximo do Mínimo</TabsTrigger>
          <TabsTrigger value="healthy-stock" className="text-green-600">Estoque Saudável</TabsTrigger>
        </TabsList>
      </Tabs>

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
};

export default InventoryControl;
