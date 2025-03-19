
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, User, AlertTriangle } from 'lucide-react';
import { useCashierOperations } from '@/hooks/use-cashier-operations';
import { CloseCashierDialog } from '@/components/cashiers/CloseCashierDialog';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { getUserCashierStatus } = useCashierOperations();
  const [isCloseCashierDialogOpen, setIsCloseCashierDialogOpen] = useState(false);
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!user) return null;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get role text in Portuguese
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'employee': return 'Funcionário';
      default: return role;
    }
  };

  const handleLogout = () => {
    const { cashier, isOpen } = getUserCashierStatus();
    
    // If user has an open cashier, show the closing dialog
    if (cashier && isOpen) {
      setIsCloseCashierDialogOpen(true);
    } else {
      // Otherwise, logout directly
      logout();
    }
  };

  const handleCloseSuccess = () => {
    toast.success("Caixa fechado com sucesso");
    logout();
  };

  const handleManagerAuth = (managerId?: string, managerName?: string) => {
    if (managerId) {
      toast.success("Autorização gerencial concedida");
      logout();
    }
    setIsManagerAuthOpen(false);
  };

  const { cashier, isOpen, balance } = getUserCashierStatus();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">{getRoleText(user.role)}</p>
              
              {/* Show cashier status if applicable */}
              {cashier && isOpen && (
                <p className="text-xs font-medium text-green-600 mt-1 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-600 mr-1.5 inline-block"></span>
                  Caixa {cashier.name} aberto
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Configurações</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Close Cashier Dialog */}
      {cashier && (
        <CloseCashierDialog
          isOpen={isCloseCashierDialogOpen}
          onClose={() => setIsCloseCashierDialogOpen(false)}
          cashierId={cashier.id}
          cashierName={cashier.name}
          currentBalance={balance}
          onCloseSuccess={handleCloseSuccess}
          showManagerAuth={() => {
            setIsCloseCashierDialogOpen(false);
            setIsManagerAuthOpen(true);
          }}
        />
      )}

      {/* Manager Auth Dialog */}
      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={() => setIsManagerAuthOpen(false)}
        onConfirm={handleManagerAuth}
        title="Autorização para Sair sem Fechar Caixa"
        description="Esta operação requer autorização de um gerente ou administrador para permitir sair sem fechar o caixa."
      />
    </>
  );
};

export default UserMenu;
