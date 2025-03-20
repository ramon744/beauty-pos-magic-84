
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ExpirationDateProps {
  expirationDate?: Date | string | null;
}

export function ExpirationDate({ expirationDate }: ExpirationDateProps) {
  if (!expirationDate) return <span className="text-muted-foreground">Não definida</span>;
  
  try {
    const today = new Date();
    const expDate = new Date(expirationDate);
    
    if (isNaN(expDate.getTime())) {
      return <span className="text-muted-foreground">Data inválida</span>;
    }
    
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let badgeVariant = "outline";
    if (daysUntilExpiration <= 0) {
      badgeVariant = "destructive";
    } else if (daysUntilExpiration <= 30) {
      badgeVariant = "warning";
    }
    
    return (
      <Badge variant={badgeVariant as any}>
        {format(expDate, "dd/MM/yyyy")}
      </Badge>
    );
  } catch (error) {
    console.error('Error formatting expiration date:', error);
    return <span className="text-muted-foreground">Formato inválido</span>;
  }
}
