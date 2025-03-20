
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
import SyncStatusIndicator from '@/components/products/SyncStatusIndicator';
import { Product } from '@/types';

const Products = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const { data: products, isLoading, error, refetch } = useFetchProducts();
  const { toast } = useToast();
  const [tabError, setTabError] = useState<string | null>(null);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleNewProduct = () => {
    setEditProductId(null);
    setActiveTab('form');
  };

  const handleEditProduct = (productId: string) => {
    console.log("Editing product with ID:", productId);
    setEditProductId(productId);
    setActiveTab('form');
  };

  const handleFormSubmitted = () => {
    setActiveTab('list');
    setEditProductId(null);
    refetch();
  };

  // Process products to ensure all required properties exist
  const safeProducts = (products || []).map((product: Product) => {
    // Ensure category exists
    const category = product.category || { id: '', name: 'Sem categoria' };
    
    // Ensure numeric values are properly handled               
    return {
      ...product,
      category,
      salePrice: typeof product.salePrice === 'number' ? product.salePrice : Number(product.salePrice) || 0,
      costPrice: typeof product.costPrice === 'number' ? product.costPrice : Number(product.costPrice) || 0,
      stock: typeof product.stock === 'number' ? product.stock : Number(product.stock) || 0,
      minimumStock: typeof product.minimumStock === 'number' ? product.minimumStock : Number(product.minimumStock) || 0
    };
  });

  const productsWithLowStock = safeProducts?.filter(
    product => product.minimumStock && product.stock <= product.minimumStock
  ) || [];

  const productsApproachingMinStock = safeProducts?.filter(
    product => product.minimumStock && 
              product.stock > product.minimumStock && 
              product.stock <= product.minimumStock * 1.5
  ) || [];

  // Error handling for tab changes
  const handleTabChange = (value: string) => {
    try {
      setTabError(null);
      setActiveTab(value);
    } catch (error) {
      console.error('Error changing tab:', error);
      setTabError('Ocorreu um erro ao mudar para esta aba. Por favor, tente novamente.');
      toast({
        variant: 'destructive',
        title: 'Erro ao mudar de aba',
        description: 'Ocorreu um erro ao tentar mudar para esta aba.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Produtos</h1>
          <SyncStatusIndicator />
        </div>
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
      
      {tabError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{tabError}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados: {error.toString()}. Por favor, recarregue a página.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
          <div className="p-4 rounded-md border border-gray-200">
            <InventoryControl />
          </div>
        </TabsContent>
        <TabsContent value="expiration">
          <div className="p-4 rounded-md border border-gray-200">
            <ExpirationControl />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Products;
