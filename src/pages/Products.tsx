
import React, { useState } from 'react';
import ProductsList from '@/components/products/ProductsList';
import ProductForm from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { ProductStats } from '@/components/products/ProductStats';
import { ProductCategories } from '@/components/products/ProductCategories';
import { useToast } from '@/components/ui/use-toast';

const Products = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const { toast } = useToast();

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
    
    toast({
      title: editProductId ? 'Produto atualizado' : 'Produto adicionado',
      description: 'Os dados foram salvos com sucesso no sistema.',
    });
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Produtos</TabsTrigger>
          <TabsTrigger value="form">
            {editProductId ? 'Editar Produto' : 'Novo Produto'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <ProductCategories />
            </div>
            <div className="md:col-span-3">
              <ProductsList onEditProduct={handleEditProduct} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="form">
          <ProductForm
            productId={editProductId}
            onSubmitted={handleFormSubmitted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Products;
