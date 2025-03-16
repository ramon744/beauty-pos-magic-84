
import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useFetchSupplier, useSaveSupplier } from '@/hooks/use-suppliers';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Supplier } from '@/types';

// Define the form schema
const supplierFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  phone: z.string().min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' }),
  email: z.string().email({ message: 'Email inválido' }),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  cnpj: z.string().min(14, { message: 'CNPJ deve ter pelo menos 14 dígitos' }),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormProps {
  supplierId: string | null;
  onSubmitted: () => void;
}

export default function SupplierForm({ supplierId, onSubmitted }: SupplierFormProps) {
  const { toast } = useToast();
  const { data: supplier, isLoading: loadingSupplier } = useFetchSupplier(supplierId || "");
  const { mutate: saveSupplier, isPending: saving } = useSaveSupplier();

  // Initialize the form
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      contactPerson: '',
      cnpj: '',
    },
  });

  // Populate form when editing an existing supplier
  useEffect(() => {
    if (supplier && supplierId) {
      form.reset({
        name: supplier.name,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address || '',
        contactPerson: supplier.contactPerson || '',
        cnpj: supplier.cnpj,
      });
    }
  }, [supplier, supplierId, form]);

  const onSubmit = (data: SupplierFormValues) => {
    // Ensure all required fields are present
    const supplierToSave: Supplier = {
      id: supplierId || crypto.randomUUID(),
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      contactPerson: data.contactPerson,
      cnpj: data.cnpj,
      createdAt: supplier?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    saveSupplier(supplierToSave, {
      onSuccess: () => {
        toast({
          title: supplierId ? 'Fornecedor atualizado' : 'Fornecedor criado',
          description: supplierId 
            ? 'O fornecedor foi atualizado com sucesso' 
            : 'O fornecedor foi criado com sucesso',
        });
        onSubmitted();
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Ocorreu um erro ao salvar o fornecedor',
        });
      }
    });
  };

  if (supplierId && loadingSupplier) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@fornecedor.com.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 0000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pessoa de Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da pessoa de contato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite o endereço completo do fornecedor" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onSubmitted}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : supplierId ? 'Atualizar Fornecedor' : 'Criar Fornecedor'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
