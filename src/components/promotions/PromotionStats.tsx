
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePromotionStatistics } from '@/hooks/use-promotions';
import { Percent, Tag, Clock, Calendar } from 'lucide-react';

// Define the type for promotion statistics
interface PromotionStatistics {
  totalPromotions: number;
  activePromotions: number;
  upcomingPromotions: number;
  expiredPromotions: number;
}

export default function PromotionStats() {
  const { data: stats, isLoading } = usePromotionStatistics() as { 
    data: PromotionStatistics | undefined;
    isLoading: boolean;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-10 w-10 bg-muted rounded-full mb-3" />
              <div className="h-5 w-24 bg-muted rounded mb-2" />
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total de Promoções',
      value: stats?.totalPromotions || 0,
      icon: Tag,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Promoções Ativas',
      value: stats?.activePromotions || 0,
      icon: Percent,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Promoções Agendadas',
      value: stats?.upcomingPromotions || 0,
      icon: Calendar,
      color: 'bg-yellow-100 text-yellow-700',
    },
    {
      label: 'Promoções Expiradas',
      value: stats?.expiredPromotions || 0,
      icon: Clock,
      color: 'bg-gray-100 text-gray-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardContent className="p-6 flex items-start">
            <div className={`${item.color} p-2 rounded-full mr-4`}>
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <h3 className="text-2xl font-bold">{item.value}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
