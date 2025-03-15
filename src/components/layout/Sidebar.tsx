
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  CircleDollarSign,
  LayoutDashboard,
  PackageSearch,
  Users,
  BarChart3,
  Clock,
  Percent,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  requiredRoles?: UserRole[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, requiredRoles = ['admin', 'manager', 'employee'] }) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(requiredRoles)) return null;
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive 
            ? "bg-sidebar-accent text-sidebar-primary font-medium" 
            : "text-sidebar-foreground"
        )
      }
    >
      <div className="min-w-[40px] h-10 flex items-center justify-center">
        {icon}
      </div>
      <span className={cn(
        "transition-all duration-200",
        "group-[.sidebar-collapsed]:opacity-0 group-[.sidebar-collapsed]:w-0 group-[.sidebar-collapsed]:hidden"
      )}>
        {label}
      </span>
    </NavLink>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col bg-sidebar transition-all duration-300 ease-in-out",
        isOpen ? "w-[240px]" : "w-[70px] sidebar-collapsed",
        "md:relative md:left-0 md:top-0 md:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {isOpen ? (
          <h1 className="text-xl font-bold text-white">Beauty<span className="text-sidebar-primary">POS</span></h1>
        ) : (
          <div className="flex justify-center w-full">
            <span className="text-xl font-bold text-sidebar-primary">B</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent ml-auto"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          <NavItem 
            to="/dashboard" 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
          />
          <NavItem 
            to="/sales" 
            icon={<CircleDollarSign size={20} />} 
            label="PDV" 
          />
          <NavItem 
            to="/products" 
            icon={<PackageSearch size={20} />} 
            label="Produtos" 
            requiredRoles={['admin', 'manager']}
          />
          <NavItem 
            to="/customers" 
            icon={<Users size={20} />} 
            label="Clientes" 
          />
          <NavItem 
            to="/promotions" 
            icon={<Percent size={20} />} 
            label="Promoções" 
            requiredRoles={['admin', 'manager']}
          />
          <NavItem 
            to="/reports" 
            icon={<BarChart3 size={20} />} 
            label="Relatórios" 
            requiredRoles={['admin', 'manager']}
          />
          <NavItem 
            to="/history" 
            icon={<Clock size={20} />} 
            label="Histórico" 
          />
          <NavItem 
            to="/users" 
            icon={<UserCog size={20} />} 
            label="Usuários" 
            requiredRoles={['admin']}
          />
        </div>
      </div>
      
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn(
          "transition-all", 
          isOpen ? "opacity-100" : "opacity-0 h-0 hidden"
        )}>
          <div className="rounded-lg bg-sidebar-accent p-3 text-xs text-sidebar-foreground">
            <p className="font-medium mb-1">Loja Ipanema</p>
            <p>Versão 1.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
