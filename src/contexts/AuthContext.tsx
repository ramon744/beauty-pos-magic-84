
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, UserRole } from '@/types';

// Mock users for the demo - will be replaced with DB integration in the future
const MOCK_USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@beauty.com',
    password: 'admin123',
    role: 'admin' as UserRole,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@beauty.com',
    password: 'manager123',
    role: 'manager' as UserRole,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Employee User',
    email: 'employee@beauty.com',
    password: 'employee123',
    role: 'employee' as UserRole,
    createdAt: new Date(),
  },
];

// Local storage keys - centralizing for future DB migration
const STORAGE_KEYS = {
  AUTH: 'beautyPosAuth',
  PRODUCTS: 'beautyPosProducts',
  CUSTOMERS: 'beautyPosCustomers',
  SALES: 'beautyPosSales',
  PROMOTIONS: 'beautyPosPromotions',
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for saved auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        setUser(parsedAuth);
      } catch (error) {
        console.error('Failed to parse stored auth', error);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    }
    setIsLoading(false);
  }, []);

  // Database integration future-proofing:
  // This function can be modified to call an API endpoint in the future
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // This will be replaced with actual API call in the future
      const foundUser = MOCK_USERS.find(
        u => u.email === email && u.password === password
      );
      
      if (foundUser) {
        // Remove password from user object before storing
        const { password, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        
        // Store in localStorage (will be replaced with tokens/session management)
        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(userWithoutPassword));
        toast.success(`Bem-vindo, ${userWithoutPassword.name}!`);
        return true;
      } else {
        toast.error('Credenciais inválidas. Tente novamente.');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    navigate('/');
    toast.info('Logout realizado com sucesso');
  };

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper for future database adapters
export const storageKeys = STORAGE_KEYS;
