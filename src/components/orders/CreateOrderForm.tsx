
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Plus, Trash, Search } from 'lucide-react';
import { toast } from "sonner";
import { useFetchProducts, useSaveProduct } from '@/hooks/use-products';
import { useFetchSuppliers, useSaveSupplier } from '@/hooks/use-suppliers';
import { Product, Supplier, Category } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  supplier: Supplier | null;
}

interface CreateOrderFormProps {
  onComplete: () => void;
}

// Add interface for Supplier with the temporary item ID
interface TempSupplier extends Partial<Supplier> {
  forItemId?: string;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onComplete }) => {
  const { data: products } = useFetchProducts();
  const { data: suppliers } = useFetchSuppliers();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // New product creation
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    stock: 0,
    minimumStock: 0,
    costPrice: 0,
    salePrice: 0
  });
  const [saveProductToCatalog, setSaveProductToCatalog] = useState(false);
  
  // New supplier creation
  const [isNewSupplierDialogOpen, setIsNewSupplierDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState<TempSupplier>({
    name: '',
    phone: '',
    email: '',
    address: '',
    contactPerson: ''
  });
  const [saveSupplierToCatalog, setSaveSupplierToCatalog] = useState(false);
  
  // Mutations for saving
  const saveProduct = useSaveProduct();
  const saveSupplier = useSaveSupplier();
  
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
    console.log('Submitting order:', orderItems);
    
    toast.success("Pedido criado com sucesso!");
    onComplete();
  };

  // Get filtered products based on search term
  const filteredProducts = products?.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Get available products (exclude ones already in the order)
  const availableProducts = filteredProducts.filter(
    product => !orderItems.some(item => item.product.id === product.id)
  );

  // Handle new product creation
  const handleCreateNewProduct = () => {
    if (!newProduct.name) {
      toast.error("Nome do produto é obrigatório");
      return;
    }

    // Create temporary product ID
    const tempId = `temp_${Date.now()}`;
    
    // Create default category for temporary products
    const defaultCategory: Category = {
      id: 'temp_category',
      name: 'Categoria Temporária'
    };
    
    // Create the product object with required properties
    const productToAdd: Product = {
      id: tempId,
      name: newProduct.name || '',
      description: newProduct.description || '',
      stock: newProduct.stock || 0,
      minimumStock: newProduct.minimumStock || 0,
      costPrice: newProduct.costPrice || 0,
      salePrice: newProduct.salePrice || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      code: `TEMP${Date.now().toString().slice(-6)}`,
      category: defaultCategory,
      supplierIds: []
    };

    // Save to catalog if checked
    if (saveProductToCatalog) {
      saveProduct.mutate(productToAdd, {
        onSuccess: () => {
          toast.success("Produto adicionado ao catálogo");
        }
      });
    }

    // Add to order items
    setOrderItems(prevItems => [
      ...prevItems,
      {
        id: Date.now().toString(),
        product: productToAdd,
        quantity: selectedQuantity || 1,
        supplier: null
      }
    ]);

    // Reset form and close dialog
    setNewProduct({
      name: '',
      stock: 0,
      minimumStock: 0,
      costPrice: 0,
      salePrice: 0
    });
    setSaveProductToCatalog(false);
    setIsNewProductDialogOpen(false);
    
    toast.success("Produto adicionado ao pedido");
  };

  // Handle new supplier creation
  const handleCreateNewSupplier = () => {
    if (!newSupplier.name) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }

    // Create temporary supplier ID
    const tempId = `temp_${Date.now()}`;
    
    // Create the supplier object with all required properties
    const supplierToAdd: Supplier = {
      id: tempId,
      name: newSupplier.name || '',
      phone: newSupplier.phone || '',
      email: newSupplier.email || '',
      address: newSupplier.address || '',
      contactPerson: newSupplier.contactPerson || '',
      cnpj: `TEMP${Date.now().toString().slice(-8)}`, // Add required CNPJ property
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to catalog if checked
    if (saveSupplierToCatalog) {
      saveSupplier.mutate(supplierToAdd, {
        onSuccess: () => {
          toast.success("Fornecedor adicionado ao catálogo");
        }
      });
    }

    // Find the selected item to update
    const selectedItemId = newSupplier.forItemId;
    if (selectedItemId) {
      setOrderItems(prevItems => prevItems.map(item => {
        if (item.id === selectedItemId) {
          return { ...item, supplier: supplierToAdd };
        }
        return item;
      }));
    }

    // Reset form and close dialog
    setNewSupplier({
      name: '',
      phone: '',
      email: '',
      address: '',
      contactPerson: '',
      forItemId: undefined
    });
    setSaveSupplierToCatalog(false);
    setIsNewSupplierDialogOpen(false);
    
    toast.success("Fornecedor adicionado");
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Product Search and Selection */}
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <FormLabel>Adicionar Produto</FormLabel>
            
            {/* Search Box */}
            <div className="flex items-center space-x-2 mb-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={() => setIsNewProductDialogOpen(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Novo Produto
              </Button>
            </div>
            
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
              const isTemporaryProduct = item.product.id.startsWith('temp_');
              
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          {isTemporaryProduct && (
                            <span className="text-xs text-amber-600">Produto temporário</span>
                          )}
                        </div>
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
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs">Fornecedor</FormLabel>
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 text-xs"
                              onClick={() => {
                                setNewSupplier(prev => ({ ...prev, forItemId: item.id }));
                                setIsNewSupplierDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Novo
                            </Button>
                          </div>
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
                                suppliers && suppliers.length > 0 ? (
                                  suppliers.map(supplier => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>
                                    Não há fornecedores disponíveis
                                  </SelectItem>
                                )
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
      
      {/* New Product Dialog */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Crie um produto temporário para este pedido
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <FormLabel htmlFor="product-name">Nome do Produto</FormLabel>
              <Input
                id="product-name"
                placeholder="Digite o nome do produto"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel htmlFor="product-description">Descrição (opcional)</FormLabel>
              <Input
                id="product-description"
                placeholder="Descrição do produto"
                value={newProduct.description || ''}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel htmlFor="product-cost">Preço de Custo</FormLabel>
                <Input
                  id="product-cost"
                  type="number"
                  placeholder="0.00"
                  value={newProduct.costPrice || ''}
                  onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="product-price">Preço de Venda</FormLabel>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="0.00"
                  value={newProduct.salePrice || ''}
                  onChange={(e) => setNewProduct({...newProduct, salePrice: Number(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel htmlFor="product-stock">Estoque Atual</FormLabel>
                <Input
                  id="product-stock"
                  type="number"
                  placeholder="0"
                  value={newProduct.stock || ''}
                  onChange={(e) => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="product-min-stock">Estoque Mínimo</FormLabel>
                <Input
                  id="product-min-stock"
                  type="number"
                  placeholder="0"
                  value={newProduct.minimumStock || ''}
                  onChange={(e) => setNewProduct({...newProduct, minimumStock: Number(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox 
                id="save-to-catalog" 
                checked={saveProductToCatalog}
                onCheckedChange={(checked) => setSaveProductToCatalog(checked === true)}
              />
              <label
                htmlFor="save-to-catalog"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Adicionar este produto ao catálogo
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsNewProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateNewProduct}>
              Adicionar Produto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* New Supplier Dialog */}
      <Dialog open={isNewSupplierDialogOpen} onOpenChange={setIsNewSupplierDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Fornecedor</DialogTitle>
            <DialogDescription>
              Crie um fornecedor temporário para este pedido
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <FormLabel htmlFor="supplier-name">Nome do Fornecedor</FormLabel>
              <Input
                id="supplier-name"
                placeholder="Digite o nome do fornecedor"
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <FormLabel htmlFor="supplier-contact">Pessoa de Contato</FormLabel>
              <Input
                id="supplier-contact"
                placeholder="Nome do contato"
                value={newSupplier.contactPerson || ''}
                onChange={(e) => setNewSupplier({...newSupplier, contactPerson: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <FormLabel htmlFor="supplier-phone">Telefone</FormLabel>
                <Input
                  id="supplier-phone"
                  placeholder="(00) 0000-0000"
                  value={newSupplier.phone || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <FormLabel htmlFor="supplier-email">E-mail</FormLabel>
                <Input
                  id="supplier-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newSupplier.email || ''}
                  onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <FormLabel htmlFor="supplier-address">Endereço</FormLabel>
              <Input
                id="supplier-address"
                placeholder="Endereço do fornecedor"
                value={newSupplier.address || ''}
                onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox 
                id="save-supplier-to-catalog" 
                checked={saveSupplierToCatalog}
                onCheckedChange={(checked) => setSaveSupplierToCatalog(checked === true)}
              />
              <label
                htmlFor="save-supplier-to-catalog"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Adicionar este fornecedor ao catálogo
              </label>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsNewSupplierDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateNewSupplier}>
              Adicionar Fornecedor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
};

