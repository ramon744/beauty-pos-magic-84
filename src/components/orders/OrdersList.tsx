
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ShoppingBag, Truck, Eye, Check, X, Phone, Mail } from 'lucide-react';
import { useFetchProducts } from '@/hooks/use-products';
import { useFetchSuppliers } from '@/hooks/use-suppliers';
import { Product, Supplier } from '@/types';

interface OrdersListProps {
  status: 'pending' | 'completed';
}

export const OrdersList: React.FC<OrdersListProps> = ({ status }) => {
  const { data: products } = useFetchProducts();
  const { data: suppliers } = useFetchSuppliers();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filter products that need to be ordered (stock <= minimumStock)
  const lowStockProducts = products?.filter(
    product => product.minimumStock && product.stock <= product.minimumStock
  ) || [];

  // Function to find suppliers for a product
  const findProductSuppliers = (productId: string): Supplier[] => {
    const product = products?.find(p => p.id === productId);
    if (!product || !product.supplierIds || !suppliers) return [];
    
    return suppliers.filter(supplier => 
      product.supplierIds && product.supplierIds.includes(supplier.id)
    );
  };

  // Function to handle viewing product and supplier details
  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsOpen(true);
  };

  // For demo purposes - in a real app, you'd have real orders with their own status
  // Currently only showing the "pending" tab with products below minimum stock
  if (status === 'completed') {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Não há histórico de pedidos</h3>
            <p className="text-sm text-muted-foreground mt-2">
              O histórico de pedidos será exibido aqui quando você realizar pedidos aos fornecedores.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Não há pedidos pendentes</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Todos os produtos estão com estoque adequado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="hidden md:table-cell">Estoque Mínimo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockProducts.map((product) => {
                const productSuppliers = findProductSuppliers(product.id);
                const primarySupplier = productSuppliers[0]; // Take the first supplier as primary

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{product.code}</TableCell>
                    <TableCell>
                      <Badge variant={product.stock === 0 ? "destructive" : "outline"}>
                        {product.stock} un
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{product.minimumStock} un</TableCell>
                    <TableCell>
                      {primarySupplier ? (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span className="truncate max-w-[120px]">{primarySupplier.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem fornecedor</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(product)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
              <DialogDescription>
                Informações do produto e fornecedores disponíveis
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 mt-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Produto</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium">Nome:</div>
                  <div>{selectedProduct.name}</div>
                  
                  <div className="font-medium">Código:</div>
                  <div>{selectedProduct.code}</div>
                  
                  <div className="font-medium">Estoque Atual:</div>
                  <div>{selectedProduct.stock} unidades</div>
                  
                  <div className="font-medium">Estoque Mínimo:</div>
                  <div>{selectedProduct.minimumStock} unidades</div>
                  
                  <div className="font-medium">Quantidade a Pedir:</div>
                  <div>{Math.max(0, (selectedProduct.minimumStock || 0) - selectedProduct.stock)} unidades</div>
                  
                  <div className="font-medium">Preço de Custo:</div>
                  <div>{formatCurrency(selectedProduct.costPrice)}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Fornecedores</h3>
                {findProductSuppliers(selectedProduct.id).length > 0 ? (
                  <div className="space-y-4">
                    {findProductSuppliers(selectedProduct.id).map(supplier => (
                      <div key={supplier.id} className="border rounded-md p-3 space-y-2">
                        <div className="font-medium text-base">{supplier.name}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {supplier.phone}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {supplier.email}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Contato: {supplier.contactPerson}</div>
                          <div>CNPJ: {supplier.cnpj}</div>
                          <div>Endereço: {supplier.address}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-2">
                    Nenhum fornecedor cadastrado para este produto.
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setIsDetailsOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="default"
                  onClick={() => {
                    /* Here you would implement order placement logic */
                    setIsDetailsOpen(false);
                  }}
                  disabled={findProductSuppliers(selectedProduct.id).length === 0}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Realizar Pedido
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
