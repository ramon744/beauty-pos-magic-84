
import React from 'react';
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

// Simulating summary data
const salesData = [
  { month: 'Jan', sales: 15000 },
  { month: 'Fev', sales: 18000 },
  { month: 'Mar', sales: 22000 },
  { month: 'Abr', sales: 19000 },
  { month: 'Mai', sales: 25000 },
  { month: 'Jun', sales: 32000 },
  { month: 'Jul', sales: 38000 },
];

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data for cards
  const stats = [
    {
      title: 'Vendas de Hoje',
      value: 'R$ 5.240,00',
      change: '+12,5%',
      trend: 'up',
      icon: <DollarSign className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
    {
      title: 'Clientes Atendidos',
      value: '48',
      change: '+8,3%',
      trend: 'up',
      icon: <Users className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
    {
      title: 'Itens Vendidos',
      value: '132',
      change: '+5,7%',
      trend: 'up',
      icon: <ShoppingBag className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
    {
      title: 'Ticket Médio',
      value: 'R$ 109,17',
      change: '-3,2%',
      trend: 'down',
      icon: <BarChart4 className="h-4 w-4" />,
      description: 'Em relação a ontem',
    },
  ];

  // Mock data for inventory alerts
  const inventoryAlerts = [
    { id: 1, name: 'Batom Matte Vermelho', stock: 2, min: 5 },
    { id: 2, name: 'Base Líquida Natural', stock: 3, min: 10 },
    { id: 3, name: 'Máscara de Cílios Volume', stock: 4, min: 8 },
    { id: 4, name: 'Pó Compacto Translúcido', stock: 1, min: 5 },
  ];

  // Mock data for top selling products
  const topProducts = [
    { id: 1, name: 'Base Líquida Matte', sales: 28, revenue: 2520 },
    { id: 2, name: 'Paleta de Sombras', sales: 24, revenue: 2880 },
    { id: 3, name: 'Batom Líquido', sales: 22, revenue: 1320 },
    { id: 4, name: 'Contorno Facial', sales: 18, revenue: 1440 },
    { id: 5, name: 'Iluminador Compacto', sales: 17, revenue: 1190 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Bem-vindo, {user?.name.split(' ')[0]}
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
            <div className="h-[300px] w-full relative">
              {/* Placeholder for chart */}
              <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                {salesData.map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-12 rounded-t-sm bg-sidebar-primary" 
                      style={{ 
                        height: `${(data.sales / 40000) * 240}px`, 
                        opacity: 0.6 + ((index + 1) / (salesData.length * 2))
                      }}
                    ></div>
                    <span className="text-xs mt-1">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">Alertas de Estoque</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryAlerts.map(product => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Estoque: {product.stock} un</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
                    <span className="text-xs font-medium text-red-600">{product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top produtos em vendas neste mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </div>
                  <div className="ml-4 space-y-1 flex-1">
                    <p className="text-sm font-medium leading-none">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sales} unidades</p>
                  </div>
                  <div className="text-sm font-medium">
                    R$ {product.revenue.toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
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
