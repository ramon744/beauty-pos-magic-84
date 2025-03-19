
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { CashierOperation } from '@/services/cashier-operations-service';
import { format } from 'date-fns';
import { AlertCircleIcon, BanknoteIcon, ShieldAlertIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CashierOperationCardProps {
  operation: CashierOperation;
  shortageAmount: number | null;
  getUserName: (userId: string) => string;
}

export const CashierOperationCard: React.FC<CashierOperationCardProps> = ({
  operation,
  shortageAmount,
  getUserName,
}) => {
  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm:ss");
  };

  const getOperationTypeBadge = (type: string) => {
    switch (type) {
      case 'open':
        return <Badge className="bg-green-500">Abertura</Badge>;
      case 'close':
        return <Badge className="bg-red-500">Fechamento</Badge>;
      case 'deposit':
        return <Badge className="bg-blue-500">Suprimento</Badge>;
      case 'withdrawal':
        return <Badge className="bg-amber-500">Sangria</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Card className="mb-4 border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{formatTime(operation.timestamp)}</span>
            {getOperationTypeBadge(operation.operationType)}
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(operation.amount)}</div>
            <div className="text-sm text-muted-foreground">
              Operador: {getUserName(operation.userId)}
            </div>
          </div>
        </div>
        
        {operation.operationType === 'open' && (
          <div className="text-sm border-t pt-2 mt-2">
            <div className="flex items-center gap-1 text-green-600">
              <BanknoteIcon className="h-4 w-4" />
              <span>Valor inicial: {formatCurrency(operation.amount)}</span>
            </div>
          </div>
        )}
        
        {operation.operationType === 'close' && (
          <div className="text-sm border-t pt-2 mt-2">
            <div className="flex items-center gap-1">
              <BanknoteIcon className="h-4 w-4" />
              <span>Valor de fechamento: {formatCurrency(operation.amount)}</span>
            </div>
            
            {operation.openingBalance !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <BanknoteIcon className="h-4 w-4 text-green-600" />
                <span>Valor inicial do caixa: {formatCurrency(operation.openingBalance)}</span>
              </div>
            )}
            
            {shortageAmount !== null && shortageAmount > 0 && (
              <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-100">
                <div className="flex items-start gap-1 text-red-600 mb-1">
                  <AlertCircleIcon className="h-4 w-4 mt-0.5" />
                  <span className="font-medium">
                    Quebra de caixa: {formatCurrency(shortageAmount)}
                  </span>
                </div>
                {operation.discrepancyReason && (
                  <div className="text-sm text-red-700">
                    <p className="mb-1"><strong>Motivo:</strong> {operation.discrepancyReason}</p>
                    {operation.managerName && (
                      <p className="flex items-center gap-1">
                        <ShieldAlertIcon className="h-4 w-4" />
                        <strong>Autorizado por:</strong> {operation.managerName}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {(operation.operationType === 'deposit' || operation.operationType === 'withdrawal') && (
          <div className="text-sm border-t pt-2 mt-2">
            {operation.reason && (
              <div className="italic text-muted-foreground">
                Motivo: {operation.reason}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
