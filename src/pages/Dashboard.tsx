
import React, { useMemo } from 'react';
import { 
  TrendingUp,
  PackageOpen,
  Users,
  AlertCircle,
  ShoppingBag,
  BarChart4,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/use-products';
import { useStatistics } from '@/hooks/use-products';
import { formatCurrency } from '@/lib/formatters';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { useProductsWithLowStock } from '@/hooks/use-dashboard';
import { useTopSellingProducts } from '@/hooks/use-dashboard';
import { useSalesSummary } from '@/hooks/use-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: productStats, isLoading: isLoadingStats } = useStatistics();
  const { data: productsWithLowStock, isLoading: isLoadingLowStock } = useProductsWithLowStock();
  const { data: topProducts, isLoading: isLoadingTopProducts } = useTopSellingProducts();
  const { data: salesSummary, isLoading: isLoadingSales } = useSalesSummary();
  
  // Calculate the sales trend based on yesterday's sales
  const getTrendData = (type) => {
    if (!salesSummary) {
      return { value: '0', change: '0%', trend: 'up' };
    }
    
    const today = salesSummary.today || {};
    const yesterday = salesSummary.yesterday || {};
    
    let value = '0';
    let change = '0%';
    let trend = 'up';
    
    switch (type) {
      case 'sales':
        value = formatCurrency(today.totalSales || 0);
        if (yesterday.totalSales && yesterday.totalSales > 0) {
          const percentChange = ((today.totalSales - yesterday.totalSales) / yesterday.totalSales) * 100;
          change = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
          trend = percentChange >= 0 ? 'up' : 'down';
        }
        break;
      case 'customers':
        value = String(today.totalCustomers || 0);
        if (yesterday.totalCustomers && yesterday.totalCustomers > 0) {
          const percentChange = ((today.totalCustomers - yesterday.totalCustomers) / yesterday.totalCustomers) * 100;
          change = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
          trend = percentChange >= 0 ? 'up' : 'down';
        }
        break;
      case 'items':
        value = String(today.totalItems || 0);
        if (yesterday.totalItems && yesterday.totalItems > 0) {
          const percentChange = ((today.totalItems - yesterday.totalItems) / yesterday.totalItems) * 100;
          change = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
          trend = percentChange >= 0 ? 'up' : 'down';
        }
        break;
      case 'average':
        const avgTicket = today.totalSales && today.totalCustomers && today.totalCustomers > 0 
          ? today.totalSales / today.totalCustomers 
          : 0;
        value = formatCurrency(avgTicket);
        
        if (yesterday.totalSales && yesterday.totalCustomers && yesterday.totalCustomers > 0) {
          const yesterdayAvg = yesterday.totalSales / yesterday.totalCustomers;
          if (yesterdayAvg > 0) {
            const percentChange = ((avgTicket - yesterdayAvg) / yesterdayAvg) * 100;
            change = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
            trend = percentChange >= 0 ? 'up' : 'down';
          }
        }
        break;
      default:
        break;
    }
    
    return { value, change, trend };
  };

  // Prepare stats cards data
  const stats = [
    {
      title: 'Vendas de Hoje',
      ...getTrendData('sales'),
      icon: <DollarSign className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
    {
      title: 'Clientes Atendidos',
      ...getTrendData('customers'),
      icon: <Users className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
    {
      title: 'Itens Vendidos',
      ...getTrendData('items'),
      icon: <ShoppingBag className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
    {
      title: 'Ticket Médio',
      ...getTrendData('average'),
      icon: <BarChart4 className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {user?.name?.split(' ')[0] || 'Usuário'}
        </h2>
        <p className="text-muted-foreground">
          <span className="font-medium">Loja Ipanema</span> • {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="overflow-hidden border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSales ? (
                <Skeleton className="h-8 w-24 mb-2" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs">
                    <span className={`flex items-center font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend === 'up' 
                        ? <ArrowUpRight className="mr-1 h-3 w-3" />
                        : <ArrowDownRight className="mr-1 h-3 w-3" />
                      }
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {stat.description}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendas dos Últimos Meses</CardTitle>
            <CardDescription>Acompanhamento mensal de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSales ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="h-[200px] w-full" />
                </div>
              </div>
            ) : (
              <div className="h-[300px]">
                <SalesChart data={salesSummary?.monthlyData || []} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Alertas de Estoque</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoadingLowStock ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {productsWithLowStock && productsWithLowStock.length > 0 ? (
                  productsWithLowStock.slice(0, 4).map(product => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Estoque: {product.stock} un</p>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
                        <span className="text-xs font-medium text-red-600">{product.stock}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum produto com estoque baixo.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top produtos em vendas neste mês</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTopProducts ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="ml-4 space-y-1 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts && topProducts.length > 0 ? (
                  topProducts.map((product, i) => (
                    <div key={product.id} className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </div>
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.salesCount} unidades</p>
                      </div>
                      <div className="text-sm font-medium">
                        {formatCurrency(product.revenue)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados de vendas disponíveis.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acesso Rápido</CardTitle>
            <CardDescription>Funcionalidades principais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="w-full flex items-center gap-3 p-3 rounded-md bg-sidebar-primary text-white hover:bg-sidebar-primary/90 transition-colors">
              <ShoppingBag className="h-5 w-5" /> 
              <span className="font-medium">Nova Venda</span>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <PackageOpen className="h-5 w-5" /> 
              <span className="font-medium">Cadastrar Produto</span>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Users className="h-5 w-5" /> 
              <span className="font-medium">Novo Cliente</span>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <TrendingUp className="h-5 w-5" /> 
              <span className="font-medium">Ver Relatórios</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
