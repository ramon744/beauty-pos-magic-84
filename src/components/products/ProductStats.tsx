
import React from 'react';
import { useStatistics } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageSearch, DollarSign, AlertCircle, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';

// Define a type for our statistics
interface ProductStatistics {
  totalProducts: number;
  stockValue: number;
  outOfStock: number;
  categories: number;
  lowStock: number;
}

export function ProductStats() {
  const { data: stats, isLoading } = useStatistics() as { data: ProductStatistics | undefined, isLoading: boolean };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28 mb-1" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Total de Produtos",
      value: stats?.totalProducts || 0,
      description: "produtos cadastrados",
      icon: <Package className="h-4 w-4 text-muted-foreground" />,
      color: "text-blue-500",
    },
    {
      title: "Valor em Estoque",
      value: formatCurrency(stats?.stockValue || 0),
      description: "valor total do estoque",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      color: "text-green-500",
    },
    {
      title: "Produtos sem Estoque",
      value: stats?.outOfStock || 0,
      description: "produtos sem estoque",
      icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
      color: "text-red-500",
    },
    {
      title: "Categorias",
      value: stats?.categories || 0,
      description: "categorias de produtos",
      icon: <PackageSearch className="h-4 w-4 text-muted-foreground" />,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
