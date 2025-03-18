
import React, { useState } from 'react';
import { Users as UsersIcon, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { User, UserRole } from '@/types';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { UserRoleSelect } from '@/components/users/UserRoleSelect';
import { Switch } from '@/components/ui/switch';

// Form validation schema
const userFormSchema = z.object({
  id: z.string()
    .min(1, 'ID é obrigatório')
    .max(6, 'ID deve ter no máximo 6 caracteres')
    .regex(/^\d+$/, 'ID deve conter apenas números'),
  name: z.string().min(3, 'Nome precisa ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha precisa ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'manager', 'employee'] as const),
  cashierLinked: z.boolean().default(false),
});

// Edit form schema with optional password
const userEditFormSchema = userFormSchema.extend({
  password: z.string().min(6, 'Senha precisa ter pelo menos 6 caracteres').optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type UserEditFormValues = z.infer<typeof userEditFormSchema>;

const Users = () => {
  const { toast } = useToast();
  const { users, addUser, updateUser, removeUser, hasPermission } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const addForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      id: '',
      name: '',
      email: '',
      password: '',
      role: 'employee',
      cashierLinked: false,
    },
  });

  const editForm = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditFormSchema),
    defaultValues: {
      id: '',
      name: '',
      email: '',
      password: '',
      role: 'employee',
      cashierLinked: false,
    },
  });

  const handleAddUser = async (data: UserFormValues) => {
    try {
      // Check if the ID already exists
      if (users.some(user => user.id === data.id)) {
        toast({
          title: 'Erro',
          description: 'Este ID já está em uso',
          variant: 'destructive',
        });
        return;
      }
      
      // Now we're explicitly passing values with the correct type
      await addUser({
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        cashierLinked: data.cashierLinked
      });
      
      toast({
        title: 'Usuário adicionado',
        description: `${data.name} foi adicionado com sucesso`,
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível adicionar o usuário',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    editForm.setValue('id', user.id);
    editForm.setValue('name', user.name);
    editForm.setValue('email', user.email);
    editForm.setValue('role', user.role);
    editForm.setValue('password', ''); // Reset password field
    editForm.setValue('cashierLinked', user.cashierLinked || false);
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async (data: UserEditFormValues) => {
    if (!selectedUser) return;
    
    try {
      // Check if the ID already exists and is not the current user's ID
      if (data.id !== selectedUser.id && users.some(user => user.id === data.id)) {
        toast({
          title: 'Erro',
          description: 'Este ID já está em uso',
          variant: 'destructive',
        });
        return;
      }
      
      // Create update object - only include password if it was provided
      const updateData: { 
        id: string;
        name: string; 
        email: string; 
        role: UserRole;
        password?: string;
        cashierLinked: boolean;
      } = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        cashierLinked: data.cashierLinked
      };
      
      // Only include password if it's not empty
      if (data.password && data.password.trim() !== '') {
        updateData.password = data.password;
      }
      
      await updateUser(selectedUser.id, updateData);
      
      toast({
        title: 'Usuário atualizado',
        description: `${data.name} foi atualizado com sucesso`,
      });
      setIsEditDialogOpen(false);
      editForm.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível atualizar o usuário',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      await removeUser(userId);
      toast({
        title: 'Usuário removido',
        description: 'Usuário removido com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o usuário',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => {
        return <span className="font-medium">{row.original.id}</span>;
      }
    },
    {
      accessorKey: 'name',
      header: 'Nome',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Perfil',
      cell: ({ row }) => {
        const role = row.original.role;
        let displayText = '';
        
        switch (role) {
          case 'admin':
            displayText = 'Administrador';
            break;
          case 'manager':
            displayText = 'Gerente';
            break;
          case 'employee':
            displayText = 'Atendente';
            break;
        }
        
        return <span>{displayText}</span>;
      },
    },
    {
      accessorKey: 'cashierLinked',
      header: 'Caixa Vinculado',
      cell: ({ row }) => {
        return <span>{row.original.cashierLinked ? 'Sim' : 'Não'}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Criado em',
      cell: ({ row }) => {
        return new Date(row.original.createdAt).toLocaleDateString('pt-BR');
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const canManageUsers = hasPermission(['admin']);
        const user = row.original;
        
        return (
          <div className="flex justify-end gap-2">
            {canManageUsers && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(user)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive/90"
                  onClick={() => handleRemoveUser(user.id)}
                  disabled={user.id === '1'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <UsersIcon className="mr-2 h-8 w-8" />
          Usuários
        </h2>
        {hasPermission(['admin']) && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={users} 
        searchColumn="name"
        searchPlaceholder="Buscar usuários..."
      />

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(handleAddUser)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID (máx. 6 dígitos)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ID numérico" 
                        {...field} 
                        maxLength={6}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <FormControl>
                      <UserRoleSelect 
                        value={field.value} 
                        onValueChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="cashierLinked"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Vincular Caixa</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Usuário precisa abrir caixa antes de vender
                      </div>
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
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID (máx. 6 dígitos)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ID numérico" 
                        {...field} 
                        maxLength={6}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha (opcional)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Deixe em branco para manter a senha atual" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil</FormLabel>
                    <FormControl>
                      <UserRoleSelect 
                        value={field.value} 
                        onValueChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="cashierLinked"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Vincular Caixa</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Usuário precisa abrir caixa antes de vender
                      </div>
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
              <DialogFooter>
                <Button type="submit">Atualizar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
