
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/formatters';

interface SalesData {
  month: string;
  sales: number;
}

interface SalesChartProps {
  data: SalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
  // If no data, show a placeholder chart
  if (!data || data.length === 0) {
    const placeholderData = [
      { month: 'Jan', sales: 0 },
      { month: 'Fev', sales: 0 },
      { month: 'Mar', sales: 0 },
      { month: 'Abr', sales: 0 },
      { month: 'Mai', sales: 0 },
      { month: 'Jun', sales: 0 },
    ];
    
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">Sem dados de vendas disponíveis</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 10,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickMargin={8}
        />
        <YAxis
          tickFormatter={(value) => `R$${value / 1000}k`}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickMargin={8}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-md">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Mês
                      </span>
                      <span className="font-bold">
                        {payload[0].payload.month}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Vendas
                      </span>
                      <span className="font-bold">
                        {formatCurrency(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar
          dataKey="sales"
          fill="#6366f1"
          radius={[4, 4, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
