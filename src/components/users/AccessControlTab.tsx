import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, Shield, User } from 'lucide-react';
import { User as UserType, UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// Define available pages for access control
const availablePages = [
  { id: 'dashboard', label: 'Dashboard', defaultRoles: ['admin', 'manager', 'employee'] },
  { id: 'sales', label: 'PDV', defaultRoles: ['admin', 'manager', 'employee'] },
  { id: 'products', label: 'Produtos', defaultRoles: ['admin', 'manager'] },
  { id: 'suppliers', label: 'Fornecedores', defaultRoles: ['admin', 'manager'] },
  { id: 'customers', label: 'Clientes', defaultRoles: ['admin', 'manager', 'employee'] },
  { id: 'orders', label: 'Pedidos', defaultRoles: ['admin', 'manager'] },
  { id: 'promotions', label: 'Promoções', defaultRoles: ['admin', 'manager'] },
  { id: 'reports', label: 'Relatórios', defaultRoles: ['admin', 'manager'] },
  { id: 'labels', label: 'Etiquetas', defaultRoles: ['admin', 'manager', 'employee'] },
  { id: 'printers', label: 'Impressoras', defaultRoles: ['admin', 'manager'] },
  { id: 'history', label: 'Histórico', defaultRoles: ['admin', 'manager', 'employee'] },
  { id: 'cashiers', label: 'Caixa', defaultRoles: ['admin', 'manager'] },
  { id: 'users', label: 'Usuários', defaultRoles: ['admin'] },
];

interface AccessControlTabProps {
  selectedUser: UserType | null;
}

export function AccessControlTab({ selectedUser }: AccessControlTabProps) {
  const { updateUser } = useAuth();
  const [accessRights, setAccessRights] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load user's access rights when selected user changes
  useEffect(() => {
    if (selectedUser) {
      // If user has custom access rights, use them
      if (selectedUser.accessRights) {
        setAccessRights(selectedUser.accessRights);
      } else {
        // Otherwise, set default access based on role
        const defaultAccess = availablePages
          .filter(page => page.defaultRoles.includes(selectedUser.role))
          .map(page => page.id);
        setAccessRights(defaultAccess);
      }
    } else {
      setAccessRights([]);
    }
  }, [selectedUser]);

  // Handle checkbox change
  const handleCheckboxChange = (pageId: string, checked: boolean) => {
    setAccessRights(prev => {
      if (checked) {
        return [...prev, pageId];
      } else {
        return prev.filter(id => id !== pageId);
      }
    });
  };

  // Save access rights
  const handleSave = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await updateUser(selectedUser.id, {
        ...selectedUser,
        accessRights
      });
      toast.success("Permissões de acesso atualizadas com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar permissões de acesso");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle select all / none
  const selectAll = () => {
    setAccessRights(availablePages.map(page => page.id));
  };

  const selectNone = () => {
    setAccessRights([]);
  };

  // Reset to defaults based on role
  const resetToDefaults = () => {
    if (!selectedUser) return;
    
    const defaultAccess = availablePages
      .filter(page => page.defaultRoles.includes(selectedUser.role))
      .map(page => page.id);
    
    setAccessRights(defaultAccess);
  };

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <User className="mr-2 h-4 w-4" />
        Selecione um usuário para gerenciar permissões
      </div>
    );
  }

  // Admin users always have full access and can't be restricted
  const isAdmin = selectedUser.role === 'admin';

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Controle de Acesso para {selectedUser.name}</h3>
      </div>
      
      {isAdmin ? (
        <div className="bg-muted/50 p-4 rounded-md text-muted-foreground text-sm flex items-center">
          <Lock className="h-4 w-4 mr-2" />
          Administradores têm acesso completo a todas as funcionalidades do sistema
        </div>
      ) : (
        <>
          <div className="flex space-x-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectAll}
              disabled={isAdmin}
            >
              Selecionar todos
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectNone}
              disabled={isAdmin}
            >
              Limpar todos
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetToDefaults}
              disabled={isAdmin}
            >
              Restaurar padrões
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availablePages.map((page) => (
              <div 
                key={page.id} 
                className="flex items-center space-x-2 border p-3 rounded-md"
              >
                <Checkbox 
                  id={`access-${page.id}`}
                  checked={accessRights.includes(page.id)}
                  onCheckedChange={(checked) => handleCheckboxChange(page.id, checked as boolean)}
                  disabled={isAdmin}
                />
                <label 
                  htmlFor={`access-${page.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                >
                  {page.label}
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={isUpdating || isAdmin}>
              {isUpdating ? "Salvando..." : "Salvar permissões"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
