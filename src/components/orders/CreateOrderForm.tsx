
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Plus, Trash } from 'lucide-react';
import { toast } from "sonner";
import { useFetchProducts } from '@/hooks/use-products';
import { useFetchSuppliers } from '@/hooks/use-suppliers';
import { Product, Supplier } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';

interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  supplier: Supplier | null;
}

interface CreateOrderFormProps {
  onComplete: () => void;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onComplete }) => {
  const { data: products } = useFetchProducts();
  const { data: suppliers } = useFetchSuppliers();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  
  const form = useForm();

  // Function to find suppliers for a product
  const findProductSuppliers = (productId: string): Supplier[] => {
    const product = products?.find(p => p.id === productId);
    if (!product || !product.supplierIds || !suppliers) return [];
    
    return suppliers.filter(supplier => 
      product.supplierIds && product.supplierIds.includes(supplier.id)
    );
  };

  // Add product to the order
  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error("Selecione um produto para adicionar");
      return;
    }

    const productToAdd = products?.find(p => p.id === selectedProductId);
    if (!productToAdd) {
      toast.error("Produto não encontrado");
      return;
    }

    // Find available suppliers for this product
    const productSuppliers = findProductSuppliers(selectedProductId);
    const preferredSupplier = productSuppliers.length > 0 ? productSuppliers[0] : null;

    // Add to order items
    setOrderItems(prevItems => [
      ...prevItems,
      {
        id: Date.now().toString(),
        product: productToAdd,
        quantity: selectedQuantity,
        supplier: preferredSupplier
      }
    ]);

    // Reset selection
    setSelectedProductId('');
    setSelectedQuantity(1);
    
    toast.success("Produto adicionado ao pedido");
  };

  // Remove product from the order
  const handleRemoveProduct = (itemId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast.info("Produto removido do pedido");
  };

  // Change supplier for an item
  const handleChangeSupplier = (itemId: string, supplierId: string) => {
    setOrderItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const newSupplier = suppliers?.find(s => s.id === supplierId) || null;
        return { ...item, supplier: newSupplier };
      }
      return item;
    }));
  };

  // Change quantity for an item
  const handleChangeQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setOrderItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  // Submit the order
  const handleSubmitOrder = () => {
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um produto ao pedido");
      return;
    }

    // Here you would implement the actual order submission
    // For this example, we'll just show a success message
    
    toast.success("Pedido criado com sucesso!");
    onComplete();
  };

  // Get filtered products (exclude ones already in the order)
  const availableProducts = products?.filter(
    product => !orderItems.some(item => item.product.id === product.id)
  ) || [];

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Product Selection */}
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <FormLabel>Adicionar Produto</FormLabel>
            <div className="flex flex-col md:flex-row gap-2">
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.length > 0 ? (
                    availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Estoque: {product.stock})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Não há produtos disponíveis
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Select 
                  value={selectedQuantity.toString()} 
                  onValueChange={(val) => setSelectedQuantity(Number(val))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Qtd" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  type="button" 
                  onClick={handleAddProduct}
                  disabled={!selectedProductId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        {orderItems.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm font-medium">Itens do Pedido:</div>
            
            {orderItems.map(item => {
              const productSuppliers = findProductSuppliers(item.product.id);
              
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">{item.product.name}</div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveProduct(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <FormLabel className="text-xs">Quantidade</FormLabel>
                          <Select 
                            value={item.quantity.toString()} 
                            onValueChange={(val) => handleChangeQuantity(item.id, Number(val))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Quantidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <FormLabel className="text-xs">Fornecedor</FormLabel>
                          <Select 
                            value={item.supplier?.id || ""} 
                            onValueChange={(val) => handleChangeSupplier(item.id, val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um fornecedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {productSuppliers.length > 0 ? (
                                productSuppliers.map(supplier => (
                                  <SelectItem key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>
                                  Não há fornecedores disponíveis
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Nenhum produto adicionado ao pedido
          </div>
        )}
        
        {/* Form Actions */}
        <div className="flex gap-2 justify-end mt-6">
          <Button type="button" variant="outline" onClick={onComplete}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmitOrder}
            disabled={orderItems.length === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Criar Pedido
          </Button>
        </div>
      </form>
    </Form>
  );
};
