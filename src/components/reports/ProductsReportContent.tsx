
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProductsReports } from '@/hooks/use-reports';
import { formatCurrency } from '@/lib/formatters';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];
const STOCK_COLORS = {
  inStock: '#10b981', // Green
  lowStock: '#f59e0b', // Amber
  outOfStock: '#ef4444'  // Red
};

const ProductsReportContent: React.FC = () => {
  const { data: productsReport, isLoading } = useProductsReports();
  
  if (isLoading || !productsReport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando dados de produtos...</p>
      </div>
    );
  }
  
  // Prepara dados para o gráfico de estoque
  const stockData = [
    { name: 'Em Estoque', value: productsReport.stockStatus.inStock, color: STOCK_COLORS.inStock },
    { name: 'Estoque Baixo', value: productsReport.stockStatus.lowStock, color: STOCK_COLORS.lowStock },
    { name: 'Sem Estoque', value: productsReport.stockStatus.outOfStock, color: STOCK_COLORS.outOfStock },
  ];
  
  // Prepara dados para o gráfico de categorias (top 5)
  const categoryData = productsReport.categoryDistribution
    .slice(0, 5)
    .map((category, index) => ({
      ...category,
      color: COLORS[index % COLORS.length]
    }));
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsReport.stockStatus.inStock}</div>
            <p className="text-xs text-muted-foreground">
              Produtos com estoque normal
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{productsReport.stockStatus.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Produtos abaixo do estoque mínimo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos sem Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{productsReport.stockStatus.outOfStock}</div>
            <p className="text-xs text-muted-foreground">
              Produtos com estoque zerado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Produtos</CardTitle>
            <CardDescription>
              Produtos mais vendidos por receita
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={productsReport.topProducts.slice(0, 5)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" 
                    tickFormatter={(value) => 
                      value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                    }
                  />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">Receita: {formatCurrency(payload[0].value as number)}</p>
                            <p className="text-xs text-muted-foreground">
                              Quantidade: {payload[0].payload.quantity} unidades
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#8884d8" name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Estoque</CardTitle>
            <CardDescription>
              Status do estoque dos produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">{data.value} produtos</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes de Produtos Mais Vendidos</CardTitle>
          <CardDescription>
            Produtos com maior volume de vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd Vendida</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsReport.topProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default ProductsReportContent;
