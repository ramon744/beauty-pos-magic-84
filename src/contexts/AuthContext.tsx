
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
  // New properties for user management
  users: User[];
  addUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
  hasPermission: () => false,
  // Initialize new properties
  users: [],
  addUser: async () => {},
  updateUser: async () => {},
  removeUser: async () => {},
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
  const [users, setUsers] = useState<User[]>([]);

  // Initialize users in storage if they don't exist
  useEffect(() => {
    const storedUsers = storageService.getItem<User[]>(STORAGE_KEYS.USERS);
    if (!storedUsers) {
      storageService.setItem(STORAGE_KEYS.USERS, demoUsers);
      setUsers(demoUsers);
    } else {
      setUsers(storedUsers);
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

  // New user management functions
  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<void> => {
    try {
      // Check if email already exists
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('Este email já está em uso');
      }

      // Create new user with ID and createdAt
      const newUser: User = {
        ...userData,
        id: uuidv4(),
        createdAt: new Date()
      };

      // Update state and storage
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      storageService.setItem(STORAGE_KEYS.USERS, updatedUsers);
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    try {
      // Find user
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('Usuário não encontrado');
      }

      // Check if email already exists (if changing email)
      if (userData.email && userData.email !== users[userIndex].email) {
        const existingUser = users.find(u => u.email === userData.email && u.id !== userId);
        if (existingUser) {
          throw new Error('Este email já está em uso');
        }
      }

      // Update user
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        ...userData
      };

      // Update state and storage
      setUsers(updatedUsers);
      storageService.setItem(STORAGE_KEYS.USERS, updatedUsers);

      // If currently logged in user is updated, update session
      if (user && user.id === userId) {
        const updatedUser = { ...user, ...userData };
        delete updatedUser.password;
        setUser(updatedUser);
        localStorage.setItem('session-user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const removeUser = async (userId: string): Promise<void> => {
    try {
      // Cannot remove your own account
      if (user && user.id === userId) {
        throw new Error('Você não pode remover sua própria conta');
      }

      // Remove user
      const updatedUsers = users.filter(u => u.id !== userId);
      
      // Update state and storage
      setUsers(updatedUsers);
      storageService.setItem(STORAGE_KEYS.USERS, updatedUsers);
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasPermission,
      // Provide the new user management functions
      users,
      addUser,
      updateUser,
      removeUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
