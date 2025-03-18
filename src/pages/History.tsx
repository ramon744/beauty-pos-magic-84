
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SalesHistoryList } from '@/components/orders/SalesHistoryList';
import { History as HistoryIcon } from 'lucide-react';

const HistoryPage = () => {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center">
          <HistoryIcon className="mr-2 h-6 w-6" />
          Histórico
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="sales">Histórico de Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="space-y-4">
          <SalesHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryPage;
