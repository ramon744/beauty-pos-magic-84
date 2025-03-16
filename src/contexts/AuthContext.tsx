
import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { toast } from '@/components/ui/use-toast';
import { User, UserRole } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  hasPermission: () => false,
});

export const useAuth = () => useContext(AuthContext);

// Demo users
const demoUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@beauty.com',
    role: 'admin',
    password: 'admin123',
    createdAt: new Date()
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@beauty.com',
    role: 'manager',
    password: 'manager123',
    createdAt: new Date()
  },
  {
    id: '3',
    name: 'Employee User',
    email: 'employee@beauty.com',
    role: 'employee',
    password: 'employee123',
    createdAt: new Date()
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize users in storage if they don't exist
  useEffect(() => {
    const storedUsers = storageService.getItem<User[]>(STORAGE_KEYS.USERS);
    if (!storedUsers) {
      storageService.setItem(STORAGE_KEYS.USERS, demoUsers);
    }
    
    // Check for session
    const sessionUser = localStorage.getItem('session-user');
    if (sessionUser) {
      try {
        setUser(JSON.parse(sessionUser));
      } catch (error) {
        console.error('Failed to parse session user');
        localStorage.removeItem('session-user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const users = storageService.getItem<User[]>(STORAGE_KEYS.USERS) || [];
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        // Create a sanitized user object (without password)
        const sessionUser = { ...foundUser };
        delete sessionUser.password;
        
        setUser(sessionUser);
        localStorage.setItem('session-user', JSON.stringify(sessionUser));
        
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${sessionUser.name}!`,
        });
        
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Falha no login",
          description: "Email ou senha incorretos",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('session-user');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};
