
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCustomersReports } from '@/hooks/use-reports';
import { formatCurrency } from '@/lib/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

const CustomersReportContent: React.FC = () => {
  const { data: customersReport, isLoading } = useCustomersReports();
  
  if (isLoading || !customersReport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando dados de clientes...</p>
      </div>
    );
  }
  
  // Formata datas para exibição no gráfico
  const newCustomersData = customersReport.newCustomers.map(item => ({
    ...item,
    month: new Date(`${item.period}-01`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  }));
  
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersReport.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersReport.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Compraram nos últimos 90 dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersReport.inactiveCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Sem compras nos últimos 90 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novos Clientes</CardTitle>
          <CardDescription>
            Clientes cadastrados nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[300px] w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={newCustomersData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">{payload[0].value} novos clientes</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                  name="Novos Clientes" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Clientes</CardTitle>
          <CardDescription>
            Clientes com maior valor em compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customersReport.topCustomers.slice(0, 5)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => 
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString()
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">Total: {formatCurrency(data.spent)}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.purchases} compras
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="spent" fill="#82ca9d" name="Valor Gasto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customersReport.topCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="text-right">{customer.purchases}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.spent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
};

export default CustomersReportContent;
