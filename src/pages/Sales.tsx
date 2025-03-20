
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import PromotionsList from '@/components/promotions/PromotionsList';
import PromotionForm from '@/components/promotions/PromotionForm';
import PromotionStats from '@/components/promotions/PromotionStats';
import SyncStatusIndicator from '@/components/products/SyncStatusIndicator';

const Promotions = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editPromotionId, setEditPromotionId] = useState<string | null>(null);

  const handleNewPromotion = () => {
    setEditPromotionId(null);
    setActiveTab('form');
  };

  const handleEditPromotion = (promotionId: string) => {
    setEditPromotionId(promotionId);
    setActiveTab('form');
  };

  const handleFormSubmitted = () => {
    setActiveTab('list');
    setEditPromotionId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Promoções</h1>
          <SyncStatusIndicator />
        </div>
        <Button onClick={handleNewPromotion} className="md:w-auto w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Promoção
        </Button>
      </div>

      <PromotionStats />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Promoções</TabsTrigger>
          <TabsTrigger value="form">
            {editPromotionId ? 'Editar Promoção' : 'Nova Promoção'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-6">
          <PromotionsList onEditPromotion={handleEditPromotion} />
        </TabsContent>
        <TabsContent value="form">
          <PromotionForm
            promotionId={editPromotionId}
            onSubmitted={handleFormSubmitted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Promotions;
