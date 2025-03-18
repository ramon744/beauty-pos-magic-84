
import React from 'react';
import { Cashier } from '@/types';
import {
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
  TableBody,
  Table,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditIcon, Trash2Icon, UnlinkIcon } from 'lucide-react';
import { format } from 'date-fns';

interface CashiersListProps {
  cashiers: Cashier[];
  onEdit: (cashier: Cashier) => void;
  onDelete: (id: string) => void;
  onUnassign: (id: string) => void;
}

export function CashiersList({ cashiers, onEdit, onDelete, onUnassign }: CashiersListProps) {
  if (cashiers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum caixa cadastrado. Crie um novo caixa para começar.
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Localização</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vinculado a</TableHead>
            <TableHead>Última atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cashiers.map((cashier) => (
            <TableRow key={cashier.id}>
              <TableCell className="font-medium">{cashier.name}</TableCell>
              <TableCell>{cashier.registerNumber}</TableCell>
              <TableCell>{cashier.location}</TableCell>
              <TableCell>
                <Badge variant={cashier.isActive ? "default" : "secondary"}>
                  {cashier.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                {cashier.assignedUserName || 'Não vinculado'}
              </TableCell>
              <TableCell>
                {format(new Date(cashier.updatedAt), 'dd/MM/yyyy HH:mm')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {cashier.assignedUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onUnassign(cashier.id)}
                      title="Desvincular"
                    >
                      <UnlinkIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(cashier)}
                    title="Editar"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(cashier.id)}
                    title="Excluir"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
