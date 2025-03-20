
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
      // First, try to parse ISO format
      expDate = parseISO(expirationDate);
      
      // If invalid, try other date formats
      if (!isValid(expDate)) {
        const parts = expirationDate.split(/[-\/]/);
        if (parts.length === 3) {
          // Try DD/MM/YYYY or MM/DD/YYYY format
          expDate = new Date(
            parseInt(parts[2]), 
            parseInt(parts[1]) - 1, 
            parseInt(parts[0])
          );
        }
      }
      
      // If still invalid, return the raw string
      if (!isValid(expDate)) {
        return <span className="text-muted-foreground">{expirationDate}</span>;
      }
    } else {
      return <span className="text-muted-foreground">Formato inválido</span>;
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
    // Return the raw value if we can't format it
    return <span className="text-muted-foreground">
      {typeof expirationDate === 'string' ? expirationDate : 'Formato inválido'}
    </span>;
  }
}
