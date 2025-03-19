
import React from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { CashierOperation } from '@/services/cashier-operations-service';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { CashierOperationCard } from './CashierOperationCard';

interface DayOperations {
  date: string;
  formattedDate: string;
  operations: CashierOperation[];
}

interface CashierDayGroupProps {
  dayGroups: DayOperations[];
  getUserName: (userId: string) => string;
  calculateShortage: (operation: CashierOperation) => number | null;
}

export const CashierDayGroup: React.FC<CashierDayGroupProps> = ({
  dayGroups,
  getUserName,
  calculateShortage,
}) => {
  if (dayGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma operação registrada para este caixa
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {dayGroups.map((dayGroup) => {
        const openOps = dayGroup.operations.filter(op => op.operationType === 'open');
        const closeOps = dayGroup.operations.filter(op => op.operationType === 'close');
        
        return (
          <AccordionItem key={dayGroup.date} value={dayGroup.date}>
            <AccordionTrigger className="hover:bg-muted px-4 rounded-md">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span>{dayGroup.formattedDate}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5 text-green-500" />
                    {openOps.length} aberturas
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5 text-red-500" />
                    {closeOps.length} fechamentos
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {dayGroup.operations.map((operation) => (
                <CashierOperationCard
                  key={operation.id}
                  operation={operation}
                  shortageAmount={calculateShortage(operation)}
                  getUserName={getUserName}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
