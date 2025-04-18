
import React, { useState, useEffect } from 'react';
import ProductsList from '@/components/products/ProductsList';
import ProductForm from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { ProductStats } from '@/components/products/ProductStats';
import { ProductCategories } from '@/components/products/ProductCategories';
import ExpirationControl from '@/components/products/ExpirationControl';
import InventoryControl from '@/components/products/InventoryControl';
import { useFetchProducts } from '@/hooks/use-products';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

const Products = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const { data: products, isLoading, error } = useFetchProducts();
  const { toast } = useToast();

  // Check for data loading issues
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: "Ocorreu um erro ao carregar a lista de produtos."
      });
    }
    
    if (!isLoading && (!products || products.length === 0)) {
      toast({
        variant: "destructive",
        title: "Sem produtos encontrados",
        description: "Não foram encontrados produtos cadastrados no sistema."
      });
    }
  }, [isLoading, products, error, toast]);

  const handleNewProduct = () => {
    setEditProductId(null);
    setActiveTab('form');
  };

  const handleEditProduct = (productId: string) => {
    setEditProductId(productId);
    setActiveTab('form');
  };

  const handleFormSubmitted = () => {
    setActiveTab('list');
    setEditProductId(null);
  };

  // Check for products with stock below minimum
  const productsWithLowStock = products?.filter(
    product => product.minimumStock && product.stock <= product.minimumStock
  ) || [];

  // Check for products approaching minimum stock (within 50% of minimum)
  const productsApproachingMinStock = products?.filter(
    product => product.minimumStock && 
              product.stock > product.minimumStock && 
              product.stock <= product.minimumStock * 1.5
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Produtos</h1>
        <Button onClick={handleNewProduct} className="md:w-auto w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <ProductStats />

      {productsWithLowStock.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Alerta de estoque mínimo:</span> {productsWithLowStock.length} produto(s) abaixo do estoque mínimo.
          </AlertDescription>
        </Alert>
      )}

      {productsApproachingMinStock.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Aviso:</span> {productsApproachingMinStock.length} produto(s) se aproximando do estoque mínimo.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="list">Lista de Produtos</TabsTrigger>
          <TabsTrigger value="form">
            {editProductId ? 'Editar Produto' : 'Novo Produto'}
          </TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="inventory">Controle de Estoque</TabsTrigger>
          <TabsTrigger value="expiration">Controle de Validade</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-6">
          <ProductsList onEditProduct={handleEditProduct} />
        </TabsContent>
        <TabsContent value="form">
          <ProductForm
            productId={editProductId}
            onSubmitted={handleFormSubmitted}
          />
        </TabsContent>
        <TabsContent value="categories">
          <div className="grid grid-cols-1 gap-6">
            <ProductCategories fullWidth />
          </div>
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryControl />
        </TabsContent>
        <TabsContent value="expiration">
          <ExpirationControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Products;
