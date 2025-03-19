
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, FileIcon, Download } from 'lucide-react';
import { CashierOperation } from '@/services/cashier-operations-service';
import { useAuth } from '@/contexts/AuthContext';
import { CashierDayGroup } from './CashierDayGroup';
import { useCashierHistory } from '@/hooks/use-cashier-history';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { exportToExcel, exportToPDF } from '@/utils/export-utils';
import { toast } from 'sonner';

interface CashierHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
  cashierName: string;
  operations: CashierOperation[];
}

export const CashierHistoryDialog = ({
  isOpen,
  onClose,
  cashierId,
  cashierName,
  operations,
}: CashierHistoryDialogProps) => {
  const { users } = useAuth();
  const { 
    groupedOperations, 
    calculateShortage,
    hasDiscrepancy
  } = useCashierHistory(isOpen, cashierId, operations);

  const getUserName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `ID: ${userId.substring(0, 6)}`;
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    try {
      const exportData = {
        operations,
        cashierName,
        getUserName,
        operationsGroupedByDay: groupedOperations
      };

      if (format === 'excel') {
        exportToExcel(exportData);
      } else {
        exportToPDF(exportData);
      }
      
      toast.success(`Relatório exportado com sucesso em formato ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório. Tente novamente.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-screen flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Histórico do Caixa: {cashierName}
            </DialogTitle>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileIcon className="h-4 w-4 mr-2" />
                  Exportar para Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileIcon className="h-4 w-4 mr-2" />
                  Exportar para PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DialogDescription>
            Histórico diário de operações e fechamentos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden my-4">
          <ScrollArea className="h-[60vh] w-full">
            <CashierDayGroup 
              dayGroups={groupedOperations}
              getUserName={getUserName}
              calculateShortage={calculateShortage}
            />
          </ScrollArea>
        </div>

        <DialogFooter className="mt-auto shrink-0 border-t pt-4">
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
