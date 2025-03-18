
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cashier, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const assignmentSchema = z.object({
  cashierId: z.string().min(1, 'Selecione um caixa'),
  userId: z.string().min(1, 'Selecione um funcionário'),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface CashierAssignmentFormProps {
  availableCashiers: Cashier[];
  onSubmit: (cashierId: string, userId: string, userName: string) => Promise<void>;
  onCancel: () => void;
}

export function CashierAssignmentForm({
  availableCashiers,
  onSubmit,
  onCancel,
}: CashierAssignmentFormProps) {
  const { users } = useAuth();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      cashierId: '',
      userId: '',
    },
  });

  useEffect(() => {
    // Include all user roles (employees, managers, and admins)
    // but only those without an assigned cashier
    const eligibleUsers = users.filter(user => 
      !user.assignedCashierId // Only show users without an assigned cashier
    );
    setFilteredUsers(eligibleUsers);
  }, [users]);

  const handleSubmit = async (data: AssignmentFormValues) => {
    try {
      const selectedUser = users.find(u => u.id === data.userId);
      if (!selectedUser) return;
      
      await onSubmit(data.cashierId, data.userId, selectedUser.name);
      form.reset();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="cashierId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caixa</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caixa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableCashiers.map((cashier) => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      {cashier.name} ({cashier.registerNumber}) - {cashier.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuário</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.role === 'employee' ? 'Atendente' : user.role === 'manager' ? 'Gerente' : 'Administrador'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Vincular
          </Button>
        </div>
      </form>
    </Form>
  );
}
