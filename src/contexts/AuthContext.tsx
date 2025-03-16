
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, UserRole } from '@/types';

// Mock users for the demo - will be replaced with DB integration in the future
const INITIAL_USERS = [
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
  USERS: 'beautyPosUsers',
  PRODUCTS: 'beautyPosProducts',
  CUSTOMERS: 'beautyPosCustomers',
  SALES: 'beautyPosSales',
  PROMOTIONS: 'beautyPosPromotions',
};

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  addUser: (userData: { name: string; email: string; password: string; role: UserRole }) => Promise<User>;
  updateUser: (id: string, userData: { name: string; email: string; role: UserRole; password?: string }) => Promise<User>;
  removeUser: (id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load users from localStorage or initialize with defaults
  useEffect(() => {
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        // Convert string dates back to Date objects
        const usersWithDates = parsedUsers.map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt)
        }));
        setUsers(usersWithDates);
      } catch (error) {
        console.error('Failed to parse stored users', error);
        setUsers(INITIAL_USERS);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      }
    } else {
      // Initialize with default users
      setUsers(INITIAL_USERS);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
  }, []);

  // Check for saved auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        // Convert createdAt string back to Date object
        if (parsedAuth && typeof parsedAuth.createdAt === 'string') {
          parsedAuth.createdAt = new Date(parsedAuth.createdAt);
        }
        setUser(parsedAuth);
      } catch (error) {
        console.error('Failed to parse stored auth', error);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    }
    setIsLoading(false);
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }, [users]);

  // Add a new user
  const addUser = async (userData: { name: string; email: string; password: string; role: UserRole }): Promise<User> => {
    // Check if email already exists
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email já está em uso');
    }
    
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date(),
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  };

  // Update an existing user
  const updateUser = async (id: string, userData: { 
    name: string; 
    email: string; 
    role: UserRole;
    password?: string 
  }): Promise<User> => {
    // Check if email already exists and belongs to a different user
    if (users.some(u => u.email === userData.email && u.id !== id)) {
      throw new Error('Email já está em uso');
    }
    
    const updatedUsers = users.map(u => {
      if (u.id === id) {
        // Create updated user object
        const updatedUser = { 
          ...u,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };
        
        // Update password only if it was provided
        if (userData.password) {
          updatedUser.password = userData.password;
        }
        
        // If this is the currently logged in user, update the auth state too
        if (user && user.id === id) {
          // Strip password from user state
          const { password, ...userWithoutPassword } = updatedUser;
          setUser(userWithoutPassword);
          localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(userWithoutPassword));
        }
        
        return updatedUser;
      }
      return u;
    });
    
    setUsers(updatedUsers);
    const updatedUser = updatedUsers.find(u => u.id === id);
    
    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  };

  // Remove a user
  const removeUser = async (id: string): Promise<boolean> => {
    // Don't allow removing the currently logged in user
    if (user && user.id === id) {
      throw new Error('Não é possível remover o usuário logado');
    }
    
    setUsers(prevUsers => prevUsers.filter(u => u.id !== id));
    return true;
  };

  // Database integration future-proofing:
  // This function can be modified to call an API endpoint in the future
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // This will be replaced with actual API call in the future
      const foundUser = users.find(
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
        users,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        addUser,
        updateUser,
        removeUser,
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
