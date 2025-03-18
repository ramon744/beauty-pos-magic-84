
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Cashier } from '@/types';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const cashierSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  registerNumber: z.string().min(1, 'Número de registro é obrigatório'),
  location: z.string().min(1, 'Localização é obrigatória'),
  isActive: z.boolean().default(true),
});

type CashierFormValues = z.infer<typeof cashierSchema>;

interface CashierFormProps {
  initialData?: Cashier;
  onSubmit: (data: CashierFormValues) => Promise<void>;
  onCancel: () => void;
}

export function CashierForm({ initialData, onSubmit, onCancel }: CashierFormProps) {
  const form = useForm<CashierFormValues>({
    resolver: zodResolver(cashierSchema),
    defaultValues: initialData || {
      name: '',
      registerNumber: '',
      location: '',
      isActive: true,
    },
  });

  const handleSubmit = async (data: CashierFormValues) => {
    try {
      await onSubmit(data);
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Caixa</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Caixa 01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registerNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Registro</FormLabel>
              <FormControl>
                <Input placeholder="Ex: C001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localização</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Térreo - Recepção" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Ativo</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? 'Atualizar' : 'Criar'} Caixa
          </Button>
        </div>
      </form>
    </Form>
  );
}
