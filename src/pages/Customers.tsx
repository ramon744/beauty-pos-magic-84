
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit, Trash2, UserPlus, Search } from 'lucide-react';
import { useCustomers } from '@/hooks/use-customers';
import PageTransition from '@/components/ui/PageTransition';
import { Textarea } from '@/components/ui/textarea';

// Form validation schema
const customerFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  cpf: z.string().min(11, 'CPF precisa ter pelo menos 11 caracteres').max(14),
  cep: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  addressNumber: z.string().optional().or(z.literal('')),
  addressComplement: z.string().optional().or(z.literal(''))
});

// Form types
type CustomerFormValues = z.infer<typeof customerFormSchema>;

const Customers = () => {
  const { toast } = useToast();
  const { customers, addCustomer, updateCustomer, removeCustomer, searchAddressByCEP } = useCustomers();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearchingCEP, setIsSearchingCEP] = useState(false);

  // Form for adding new customers
  const addForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      cep: '',
      address: '',
      addressNumber: '',
      addressComplement: '',
    },
  });

  // Form for editing customers
  const editForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      cep: '',
      address: '',
      addressNumber: '',
      addressComplement: '',
    },
  });

  // Handle CEP search for add form
  const handleCEPSearchAdd = async () => {
    const cep = addForm.getValues('cep');
    if (!cep || cep.length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Por favor, digite um CEP válido com 8 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearchingCEP(true);
    try {
      const addressData = await searchAddressByCEP(cep);
      if (addressData) {
        // Only fill the street address, not number or complement
        const streetAddress = `${addressData.logradouro}, ${addressData.bairro}, ${addressData.localidade} - ${addressData.uf}`;
        addForm.setValue('address', streetAddress);
        toast({
          title: 'Endereço encontrado',
          description: 'Endereço preenchido com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao buscar endereço',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingCEP(false);
    }
  };

  // Handle CEP search for edit form
  const handleCEPSearchEdit = async () => {
    const cep = editForm.getValues('cep');
    if (!cep || cep.length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Por favor, digite um CEP válido com 8 dígitos.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearchingCEP(true);
    try {
      const addressData = await searchAddressByCEP(cep);
      if (addressData) {
        // Only fill the street address, not number or complement
        const streetAddress = `${addressData.logradouro}, ${addressData.bairro}, ${addressData.localidade} - ${addressData.uf}`;
        editForm.setValue('address', streetAddress);
        toast({
          title: 'Endereço encontrado',
          description: 'Endereço preenchido com sucesso.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao buscar endereço',
        variant: 'destructive',
      });
    } finally {
      setIsSearchingCEP(false);
    }
  };

  // Handle submitting new customer form
  const onAddSubmit = async (data: CustomerFormValues) => {
    try {
      await addCustomer({
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        cpf: data.cpf,
        address: data.address,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        cep: data.cep,
      });
      
      toast({
        title: 'Cliente adicionado',
        description: 'Cliente foi cadastrado com sucesso.',
      });
      
      setIsAddDialogOpen(false);
      addForm.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao adicionar cliente',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog with customer data
  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    editForm.setValue('name', customer.name);
    editForm.setValue('email', customer.email || '');
    editForm.setValue('phone', customer.phone || '');
    editForm.setValue('cpf', customer.cpf);
    editForm.setValue('address', customer.address || '');
    editForm.setValue('addressNumber', customer.addressNumber || '');
    editForm.setValue('addressComplement', customer.addressComplement || '');
    editForm.setValue('cep', customer.cep || '');
    setIsEditDialogOpen(true);
  };

  // Handle submitting edit customer form
  const onEditSubmit = async (data: CustomerFormValues) => {
    if (!selectedCustomer) return;
    
    try {
      await updateCustomer(selectedCustomer.id, {
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        cpf: data.cpf,
        address: data.address,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        cep: data.cep,
      });
      
      toast({
        title: 'Cliente atualizado',
        description: 'Cliente foi atualizado com sucesso.',
      });
      
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar cliente',
        variant: 'destructive',
      });
    }
  };

  // Handle deleting a customer
  const handleDelete = async (customer: Customer) => {
    if (confirm(`Tem certeza que deseja excluir o cliente "${customer.name}"?`)) {
      try {
        await removeCustomer(customer.id);
        toast({
          title: 'Cliente excluído',
          description: 'Cliente foi excluído com sucesso.',
        });
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao excluir cliente',
          variant: 'destructive',
        });
      }
    }
  };

  // Table columns definition
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'phone',
      header: 'Telefone',
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
    },
    {
      accessorKey: 'address',
      header: 'Endereço',
      cell: ({ row }) => {
        const customer = row.original;
        let fullAddress = customer.address || '';
        
        if (customer.addressNumber) {
          fullAddress += `, ${customer.addressNumber}`;
        }
        
        if (customer.addressComplement) {
          fullAddress += ` - ${customer.addressComplement}`;
        }
        
        return fullAddress;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Cadastrado em',
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const customer = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(customer)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(customer)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageTransition>
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gerenciamento de Clientes</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">Todos os Clientes</TabsTrigger>
          </TabsList>
          <TabsContent value="customers" className="mt-6">
            <DataTable 
              columns={columns} 
              data={customers} 
              searchColumn="name"
              searchPlaceholder="Buscar por nome..."
            />
          </TabsContent>
        </Tabs>

        {/* Add Customer Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do cliente abaixo
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="00000000" maxLength={8} {...field} />
                        </FormControl>
                        <Button 
                          type="button" 
                          onClick={handleCEPSearchAdd}
                          disabled={isSearchingCEP}
                          variant="outline"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Buscar
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Endereço completo" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="addressNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="addressComplement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto 101, Bloco B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Adicionar Cliente</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize os dados do cliente abaixo
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="00000000" maxLength={8} {...field} />
                        </FormControl>
                        <Button 
                          type="button" 
                          onClick={handleCEPSearchEdit}
                          disabled={isSearchingCEP}
                          variant="outline"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Buscar
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Endereço completo" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="addressNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="addressComplement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input placeholder="Apto 101, Bloco B" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default Customers;
