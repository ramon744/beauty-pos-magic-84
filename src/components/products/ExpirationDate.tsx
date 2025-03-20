
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format, isValid, parseISO } from 'date-fns';

interface ExpirationDateProps {
  expirationDate?: Date | string | null;
}

export function ExpirationDate({ expirationDate }: ExpirationDateProps) {
  if (!expirationDate) return <span className="text-muted-foreground">Não definida</span>;
  
  try {
    const today = new Date();
    let expDate: Date;
    
    if (expirationDate instanceof Date) {
      expDate = expirationDate;
    } else if (typeof expirationDate === 'string') {
      // Try to parse ISO format first (from database)
      expDate = parseISO(expirationDate);
      
      // If invalid, try other date formats
      if (!isValid(expDate)) {
        const parts = expirationDate.split(/[-\/]/);
        if (parts.length === 3) {
          // Try DD/MM/YYYY format
          expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
    } else {
      return <span className="text-muted-foreground">Formato inválido</span>;
    }
    
    if (!isValid(expDate)) {
      console.log('Data inválida:', expirationDate);
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
    console.error('Error formatting expiration date:', error, 'Value was:', expirationDate);
    return <span className="text-muted-foreground">Formato inválido</span>;
  }
}
