
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

interface ProductActionsProps {
  productId: string;
  productName: string;
  onEditProduct: (productId: string) => void;
  isDeleting: boolean;
  onDeleteConfirm: () => void;
  isDeleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
}

export function ProductActions({ 
  productId, 
  productName,
  onEditProduct, 
  isDeleting,
  onDeleteConfirm,
  isDeleteDialogOpen,
  setDeleteDialogOpen
}: ProductActionsProps) {
  
  const handleDelete = () => {
    onDeleteConfirm();
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEditProduct(productId)}
        title="Editar"
      >
        <Edit className="h-4 w-4" />
      </Button>
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => !open && setDeleteDialogOpen(false)}
      >
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteDialogOpen(true)}
            title="Excluir"
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto 
              "{productName}" e removerá os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
