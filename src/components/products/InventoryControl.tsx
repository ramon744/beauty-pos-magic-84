import React, { useState } from 'react';
import { useFetchProducts, useStockAdjustment, useStockHistory } from '@/hooks/use-products';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Product } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, X, AlertTriangle, CheckCircle, PackageCheck, Plus, Minus, 
  Scale, PackagePlus, PackageMinus, Save, ArrowUp, ArrowDown, RefreshCw,
  Clock, User, CalendarClock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const InventoryControl = () => {
  const { data: products, isLoading } = useFetchProducts();
  const { data: stockHistory } = useStockHistory('');
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { mutate: adjustStock } = useStockAdjustment();
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeInventoryTab, setActiveInventoryTab] = useState<string>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'balance' | 'add' | 'remove' | null>(null);
  const [newStockValue, setNewStockValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);

  const filteredProducts = products ? products.filter(product => {
    if (searchValue && 
        !product.name.toLowerCase().includes(searchValue.toLowerCase()) &&
        !product.code.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    
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

  const openAdjustmentDialog = (product: Product, type: 'balance' | 'add' | 'remove') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    
    if (type === 'balance') {
      setNewStockValue(product.stock);
    } else if (type === 'add') {
      setAdjustmentQuantity(1);
    } else { // remove
      setAdjustmentQuantity(1);
    }
    
    setAdjustmentReason('');
  };

  const closeAdjustmentDialog = () => {
    setSelectedProduct(null);
    setAdjustmentType(null);
    setNewStockValue(0);
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
  };

  const handleStockAdjustment = (product: Product, adjustment: number) => {
    const newStock = product.stock + adjustment;
    
    if (newStock < 0) {
      toast({
        variant: "destructive",
        title: "Operação inválida",
        description: "O estoque não pode ficar negativo.",
      });
      return;
    }
    
    adjustStock(
      {
        productId: product.id,
        quantity: Math.abs(adjustment),
        reason: 'Ajuste rápido de estoque',
        adjustmentType: adjustment > 0 ? 'add' : 'remove'
      },
      {
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
      }
    );
  };

  const handleConfirmAdjustment = () => {
    if (!selectedProduct || adjustmentType === null) return;

    let newStock: number;
    
    switch (adjustmentType) {
      case 'balance':
        newStock = newStockValue;
        break;
      case 'add':
        newStock = selectedProduct.stock + adjustmentQuantity;
        break;
      case 'remove':
        newStock = selectedProduct.stock - adjustmentQuantity;
        break;
      default:
        return;
    }

    if (newStock < 0) {
      toast({
        variant: "destructive",
        title: "Operação inválida",
        description: "O estoque não pode ficar negativo.",
      });
      return;
    }

    adjustStock(
      {
        productId: selectedProduct.id,
        quantity: adjustmentType === 'balance' 
          ? Math.abs(newStock - selectedProduct.stock) 
          : adjustmentQuantity,
        reason: adjustmentReason || `Ajuste de estoque (${adjustmentType})`,
        adjustmentType: adjustmentType
      },
      {
        onSuccess: () => {
          const actionMap = {
            'balance': 'Balanço',
            'add': 'Entrada',
            'remove': 'Retirada'
          };
          
          toast({
            title: "Estoque atualizado",
            description: `${actionMap[adjustmentType]} de estoque registrado com sucesso.`,
          });
          
          closeAdjustmentDialog();
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Ocorreu um erro ao atualizar o estoque.",
          });
        }
      }
    );
  };

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

  const getAdjustmentTypeText = (type: 'balance' | 'add' | 'remove') => {
    switch (type) {
      case 'balance': return 'Balanço';
      case 'add': return 'Entrada';
      case 'remove': return 'Retirada';
    }
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
              onClick={() => openAdjustmentDialog(product, 'remove')}
              title="Retirar do estoque"
            >
              <PackageMinus className="h-4 w-4" />
            </Button>

            <div className="w-16 text-center font-medium">
              {product.stock}
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => openAdjustmentDialog(product, 'add')}
              title="Adicionar ao estoque"
            >
              <PackagePlus className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => openAdjustmentDialog(product, 'balance')}
              title="Fazer balanço"
              className="ml-2"
            >
              <Scale className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const getDialogTitle = () => {
    if (!adjustmentType || !selectedProduct) return '';
    
    switch (adjustmentType) {
      case 'balance':
        return `Balanço de Estoque: ${selectedProduct.name}`;
      case 'add':
        return `Entrada de Estoque: ${selectedProduct.name}`;
      case 'remove':
        return `Retirada de Estoque: ${selectedProduct.name}`;
    }
  };

  const getDialogIcon = () => {
    switch (adjustmentType) {
      case 'balance':
        return <Scale className="h-5 w-5 mr-2" />;
      case 'add':
        return <ArrowUp className="h-5 w-5 mr-2 text-green-600" />;
      case 'remove':
        return <ArrowDown className="h-5 w-5 mr-2 text-red-600" />;
      default:
        return null;
    }
  };

  const formatDateTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if the date is valid before formatting
      if (!isValid(dateObj)) {
        return 'Data inválida';
      }
      
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (err) {
      console.error("Error formatting date:", err, date);
      return "Data inválida";
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeInventoryTab} onValueChange={setActiveInventoryTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos e Ajustes</TabsTrigger>
          <TabsTrigger value="history">Histórico de Movimentações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Histórico de Movimentações de Estoque
              </CardTitle>
              <CardDescription>
                Registro de todas as operações de ajuste, entrada e retirada de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!stockHistory || stockHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma movimentação de estoque registrada.
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockHistory.slice(0, 50).map(entry => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatDateTime(entry.timestamp)}
                          </TableCell>
                          <TableCell>{entry.productName}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                entry.adjustmentType === 'add' ? "bg-green-50 text-green-700 border-green-200" :
                                entry.adjustmentType === 'remove' ? "bg-red-50 text-red-700 border-red-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              {getAdjustmentTypeText(entry.adjustmentType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {entry.previousStock} → {entry.newStock}
                          </TableCell>
                          <TableCell>
                            {entry.quantity}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{entry.userName || user?.name || "Usuário do Sistema"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.reason || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={adjustmentType !== null} onOpenChange={(open) => !open && closeAdjustmentDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {getDialogIcon()}
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              {adjustmentType === 'balance' 
                ? 'Atualize o valor exato do estoque após contagem física.' 
                : adjustmentType === 'add' 
                  ? 'Adicione unidades ao estoque atual.' 
                  : 'Retire unidades do estoque atual.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="font-medium min-w-[120px]">Estoque atual:</div>
              <div className="font-bold">{selectedProduct?.stock || 0} unidades</div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="font-medium min-w-[120px]">Responsável:</div>
              <div className="font-bold">{user?.name || 'Usuário do Sistema'} ({user?.role === 'admin' ? 'Administrador' : 'Gerente'})</div>
            </div>

            {adjustmentType === 'balance' ? (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-stock" className="text-right col-span-1">
                  Novo estoque:
                </Label>
                <div className="col-span-3">
                  <Input
                    id="new-stock"
                    type="number"
                    min="0"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(Number(e.target.value))}
                    className={cn(
                      newStockValue < (selectedProduct?.stock || 0) ? "border-red-300" : 
                      newStockValue > (selectedProduct?.stock || 0) ? "border-green-300" : ""
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="adjust-quantity" className="text-right col-span-1">
                  Quantidade:
                </Label>
                <div className="col-span-3">
                  <Input
                    id="adjust-quantity"
                    type="number"
                    min="1"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="adjustment-reason" className="text-right col-span-1">
                Motivo:
              </Label>
              <div className="col-span-3">
                <Input
                  id="adjustment-reason"
                  placeholder="Informe o motivo do ajuste"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>
            </div>

            {adjustmentType === 'balance' && (
              <div className="flex items-center space-x-2 mt-4">
                <div className="font-medium min-w-[120px]">Novo total:</div>
                <div className={cn(
                  "font-bold",
                  newStockValue < (selectedProduct?.stock || 0) ? "text-red-600" : 
                  newStockValue > (selectedProduct?.stock || 0) ? "text-green-600" : ""
                )}>
                  {newStockValue} unidades
                  {selectedProduct && (
                    <span className="ml-2 text-sm font-normal">
                      ({newStockValue > selectedProduct.stock 
                        ? `+${newStockValue - selectedProduct.stock}` 
                        : newStockValue < selectedProduct.stock 
                          ? `-${selectedProduct.stock - newStockValue}` 
                          : 'sem alteração'})
                    </span>
                  )}
                </div>
              </div>
            )}

            {adjustmentType !== 'balance' && (
              <div className="flex items-center space-x-2 mt-4">
                <div className="font-medium min-w-[120px]">Novo total:</div>
                <div className={cn(
                  "font-bold",
                  adjustmentType === 'remove' ? "text-red-600" : "text-green-600"
                )}>
                  {selectedProduct && (
                    adjustmentType === 'add' 
                      ? selectedProduct.stock + adjustmentQuantity
                      : selectedProduct.stock - adjustmentQuantity
                  )} unidades
                  <span className="ml-2 text-sm font-normal">
                    ({adjustmentType === 'add' ? '+' : '-'}{adjustmentQuantity})
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={closeAdjustmentDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmAdjustment}
              disabled={
                (adjustmentType === 'balance' && selectedProduct?.stock === newStockValue) ||
                (adjustmentType !== 'balance' && adjustmentQuantity <= 0) ||
                (adjustmentType === 'remove' && selectedProduct && (selectedProduct.stock - adjustmentQuantity < 0)) ||
                !adjustmentReason
              }
              className={cn(
                adjustmentType === 'remove' ? "bg-red-600 hover:bg-red-700" : 
                adjustmentType === 'add' ? "bg-green-600 hover:bg-green-700" : ""
              )}
            >
              <Save className="mr-2 h-4 w-4" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryControl;
