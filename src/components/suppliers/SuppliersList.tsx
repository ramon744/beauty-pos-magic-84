
import React, { useState } from 'react';
import { useFetchSuppliers, useDeleteSupplier } from '@/hooks/use-suppliers';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import { Supplier } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SuppliersListProps {
  onEditSupplier: (supplierId: string) => void;
}

export default function SuppliersList({ onEditSupplier }: SuppliersListProps) {
  const { data: suppliers, isLoading } = useFetchSuppliers();
  const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier();
  const { toast } = useToast();
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const confirmDelete = () => {
    if (!supplierToDelete) return;
    
    deleteSupplier(supplierToDelete.id, {
      onSuccess: () => {
        toast({
          title: 'Fornecedor excluído',
          description: `${supplierToDelete.name} foi excluído com sucesso.`,
        });
        setSupplierToDelete(null);
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Erro ao excluir',
          description: `Não foi possível excluir o fornecedor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        });
      },
    });
  };

  const cancelDelete = () => {
    setSupplierToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-4 md:p-6 overflow-auto">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell">Contato</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers && suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{supplier.cnpj}</TableCell>
                      <TableCell className="hidden md:table-cell">{supplier.phone}</TableCell>
                      <TableCell className="hidden md:table-cell">{supplier.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditSupplier(supplier.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(supplier)}
                            disabled={isDeleting}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum fornecedor encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor {supplierToDelete?.name}?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
