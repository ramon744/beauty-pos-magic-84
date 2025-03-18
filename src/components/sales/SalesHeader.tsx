
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { User } from '@/types';

interface SalesHeaderProps {
  user: User | null;
}

export const SalesHeader: React.FC<SalesHeaderProps> = ({ user }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <h2 className="text-3xl font-bold tracking-tight flex items-center">
        <ShoppingCart className="mr-2 h-8 w-8" />
        Nova Venda
      </h2>
      <p className="text-muted-foreground">
        <span className="font-medium">Atendente: {user?.name}</span> • 
        {new Date().toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  );
};
