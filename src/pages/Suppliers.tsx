
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import SuppliersList from '@/components/suppliers/SuppliersList';
import SupplierForm from '@/components/suppliers/SupplierForm';

const Suppliers = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editSupplierId, setEditSupplierId] = useState<string | null>(null);

  const handleNewSupplier = () => {
    setEditSupplierId(null);
    setActiveTab('form');
  };

  const handleEditSupplier = (supplierId: string) => {
    setEditSupplierId(supplierId);
    setActiveTab('form');
  };

  const handleFormSubmitted = () => {
    setActiveTab('list');
    setEditSupplierId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Fornecedores</h1>
        <Button onClick={handleNewSupplier} className="md:w-auto w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Fornecedores</TabsTrigger>
          <TabsTrigger value="form">
            {editSupplierId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <SuppliersList onEditSupplier={handleEditSupplier} />
        </TabsContent>
        <TabsContent value="form">
          <SupplierForm
            supplierId={editSupplierId}
            onSubmitted={handleFormSubmitted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Suppliers;
