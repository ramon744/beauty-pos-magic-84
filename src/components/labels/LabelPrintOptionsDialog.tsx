
import React from 'react';
import { Printer, FileDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LabelPrintOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  labelCount: number;
}

export const LabelPrintOptionsDialog: React.FC<LabelPrintOptionsDialogProps> = ({
  open,
  onOpenChange,
  onPrint,
  onDownloadPdf,
  labelCount,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Opções de Impressão</DialogTitle>
          <DialogDescription>
            Escolha como deseja imprimir suas {labelCount} etiquetas
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button 
            onClick={onPrint} 
            className="flex flex-col items-center justify-center h-24 gap-2"
            variant="outline"
          >
            <Printer className="h-8 w-8" />
            <span>Enviar para Impressora</span>
          </Button>
          
          <Button 
            onClick={onDownloadPdf} 
            className="flex flex-col items-center justify-center h-24 gap-2"
            variant="outline"
          >
            <FileDown className="h-8 w-8" />
            <span>Baixar como PDF</span>
          </Button>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
