
import React, { useState } from 'react';
import { OrdersList } from '@/components/orders/OrdersList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFetchProducts } from '@/hooks/use-products';

const Orders = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const { data: products } = useFetchProducts();

  // Count products with low stock that need to be ordered
  const lowStockItems = products?.filter(
    product => product.minimumStock && product.stock <= product.minimumStock
  ) || [];

  const orderNeededCount = lowStockItems.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciamento de Pedidos</h1>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Pendentes
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderNeededCount}</div>
            <p className="text-xs text-muted-foreground">
              Produtos abaixo do estoque mínimo
            </p>
          </CardContent>
        </Card>
      </div>

      {orderNeededCount > 0 && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Atenção:</span> {orderNeededCount} produto(s) precisam ser reabastecidos.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pedidos Pendentes</TabsTrigger>
          <TabsTrigger value="history">Histórico de Pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
          <OrdersList status="pending" />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <OrdersList status="completed" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Orders;
