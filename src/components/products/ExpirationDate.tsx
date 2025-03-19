
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ExpirationDateProps {
  expirationDate?: Date | string;
}

export function ExpirationDate({ expirationDate }: ExpirationDateProps) {
  if (!expirationDate) return <span className="text-muted-foreground">Não definida</span>;
  
  const today = new Date();
  const expDate = new Date(expirationDate);
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
}
