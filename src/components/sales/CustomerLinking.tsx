
import React, { useState } from 'react';
import { UserRound, UserPlus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Customer } from '@/types';
import { useCustomers } from '@/hooks/use-customers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Esquema de validação para a busca de CPF
const cpfSearchSchema = z.object({
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 dígitos").max(14)
});

// Esquema de validação para o cadastro rápido
const quickCustomerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 dígitos").max(14),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").optional()
});

type CpfSearchFormValues = z.infer<typeof cpfSearchSchema>;
type QuickCustomerFormValues = z.infer<typeof quickCustomerSchema>;

interface CustomerLinkingProps {
  linkedCustomer: Customer | null;
  onLinkCustomer: (customer: Customer) => void;
  onUnlinkCustomer: () => void;
}

export const CustomerLinking: React.FC<CustomerLinkingProps> = ({
  linkedCustomer,
  onLinkCustomer,
  onUnlinkCustomer
}) => {
  const { customers, addCustomer } = useCustomers();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<Customer | null>(null);
  const [searchError, setSearchError] = useState('');

  // Form para busca por CPF
  const searchForm = useForm<CpfSearchFormValues>({
    resolver: zodResolver(cpfSearchSchema),
    defaultValues: {
      cpf: ''
    }
  });

  // Form para cadastro rápido
  const registerForm = useForm<QuickCustomerFormValues>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: ''
    }
  });

  // Formata o CPF para exibição
  const formatCPF = (cpf: string) => {
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length === 11) {
      return cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  // Busca cliente por CPF
  const handleSearchCustomer = (data: CpfSearchFormValues) => {
    const cleanCpf = data.cpf.replace(/\D/g, '');
    const foundCustomer = customers.find(customer => customer.cpf.replace(/\D/g, '') === cleanCpf);
    
    if (foundCustomer) {
      setSearchResult(foundCustomer);
      setSearchError('');
    } else {
      setSearchResult(null);
      setSearchError('Cliente não encontrado');
      // Preenche automaticamente o CPF no formulário de cadastro rápido
      registerForm.setValue('cpf', data.cpf);
    }
  };

  // Realiza o cadastro rápido do cliente
  const handleQuickRegister = async (data: QuickCustomerFormValues) => {
    try {
      const newCustomer = await addCustomer({
        name: data.name,
        cpf: data.cpf,
        phone: data.phone || '',
        email: ''
      });
      
      onLinkCustomer(newCustomer);
      setIsQuickRegisterOpen(false);
      setIsSearchDialogOpen(false);
      registerForm.reset();
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
    }
  };

  // Seleciona o cliente encontrado
  const handleSelectCustomer = () => {
    if (searchResult) {
      onLinkCustomer(searchResult);
      setIsSearchDialogOpen(false);
      searchForm.reset();
      setSearchResult(null);
    }
  };

  return (
    <>
      {linkedCustomer ? (
        <Card className="mb-4 bg-blue-50 border-blue-200">
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <div className="font-medium flex items-center">
                <UserRound className="h-4 w-4 mr-2" />
                Cliente: {linkedCustomer.name}
              </div>
              <div className="text-sm text-muted-foreground">
                CPF: {formatCPF(linkedCustomer.cpf)}
              </div>
              {linkedCustomer.phone && (
                <div className="text-sm text-muted-foreground">
                  Telefone: {linkedCustomer.phone}
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onUnlinkCustomer}
            >
              <X className="h-4 w-4 mr-1" />
              Remover
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Button 
          variant="outline" 
          className="w-full mb-4 border-dashed"
          onClick={() => setIsSearchDialogOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Vincular Cliente
        </Button>
      )}

      {/* Diálogo de busca de cliente */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buscar Cliente</DialogTitle>
            <DialogDescription>
              Digite o CPF do cliente para vincular à venda
            </DialogDescription>
          </DialogHeader>
          
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(handleSearchCustomer)} className="space-y-4">
              <FormField
                control={searchForm.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Digite o CPF do cliente"
                          {...field}
                          onChange={(e) => {
                            // Limpa o resultado anterior ao digitar
                            setSearchResult(null);
                            setSearchError('');
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <Button type="submit" size="sm">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          {/* Resultado da busca */}
          {searchResult && (
            <div className="mt-4 p-3 border rounded-md bg-blue-50">
              <h4 className="font-medium">{searchResult.name}</h4>
              <p className="text-sm">CPF: {formatCPF(searchResult.cpf)}</p>
              {searchResult.phone && (
                <p className="text-sm">Telefone: {searchResult.phone}</p>
              )}
              <Button 
                className="mt-2 w-full" 
                size="sm"
                onClick={handleSelectCustomer}
              >
                Selecionar Cliente
              </Button>
            </div>
          )}

          {/* Mensagem de erro e opção de cadastro */}
          {searchError && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-red-500">{searchError}</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setIsQuickRegisterOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Cadastrar Novo Cliente
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSearchDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de cadastro rápido */}
      <Dialog open={isQuickRegisterOpen} onOpenChange={setIsQuickRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados básicos para cadastrar o cliente
            </DialogDescription>
          </DialogHeader>
          
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(handleQuickRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={registerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="Telefone (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsQuickRegisterOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar e Vincular</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};
