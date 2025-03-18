
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SalesReportContent from '@/components/reports/SalesReportContent';
import ProductsReportContent from '@/components/reports/ProductsReportContent';
import CustomersReportContent from '@/components/reports/CustomersReportContent';
import { useQueries, useIsFetching } from '@tanstack/react-query';
import { useProducts } from '@/hooks/use-products';
import { useSalesReports } from '@/hooks/use-reports';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const isFetching = useIsFetching();
  
  return (
    <div className="container p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize e exporte relatórios detalhados sobre vendas, produtos e clientes.
        </p>
      </div>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <SalesReportContent />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <ProductsReportContent />
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-4">
          <CustomersReportContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
