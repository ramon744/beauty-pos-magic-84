
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User, UserRole } from '@/types';
import { STORAGE_KEYS } from '@/services/storage-service';

// Definição da interface de loja
interface Store {
  id: string;
  name: string;
  createdAt: Date;
}

// Estender o tipo de usuário para incluir a loja
interface UserWithStore extends User {
  storeId: string;
}

// Mock de lojas para a demonstração
const INITIAL_STORES: Store[] = [
  {
    id: '1',
    name: 'Loja Principal',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Filial Centro',
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Filial Shopping',
    createdAt: new Date(),
  },
];

// Mock users for the demo - will be replaced with DB integration in the future
const INITIAL_USERS: UserWithStore[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@beauty.com',
    password: 'admin123',
    role: 'admin' as UserRole,
    storeId: '1', // Loja Principal
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@beauty.com',
    password: 'manager123',
    role: 'manager' as UserRole,
    storeId: '1', // Loja Principal
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Employee User',
    email: 'employee@beauty.com',
    password: 'employee123',
    role: 'employee' as UserRole,
    storeId: '1', // Loja Principal
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Store 2 Manager',
    email: 'manager2@beauty.com',
    password: 'manager123',
    role: 'manager' as UserRole,
    storeId: '2', // Filial Centro
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'Store 3 Manager',
    email: 'manager3@beauty.com',
    password: 'manager123',
    role: 'manager' as UserRole,
    storeId: '3', // Filial Shopping
    createdAt: new Date(),
  },
];

// Local storage keys specific to this context
const AUTH_STORAGE_KEYS = {
  AUTH: 'beautyPosAuth',
  USERS: 'beautyPosUsers',
  STORES: 'beautyPosStores',
  PRODUCTS: 'beautyPosProducts',
  CUSTOMERS: 'beautyPosCustomers',
  SALES: 'beautyPosSales',
  PROMOTIONS: 'beautyPosPromotions',
};

interface AuthContextType {
  user: UserWithStore | null;
  users: UserWithStore[];
  stores: Store[];
  currentStore: Store | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
  addUser: (userData: { id: string; name: string; email: string; password: string; role: UserRole; storeId: string }) => Promise<UserWithStore>;
  updateUser: (id: string, userData: { id: string; name: string; email: string; role: UserRole; storeId: string; password?: string }) => Promise<UserWithStore>;
  removeUser: (id: string) => Promise<boolean>;
  addStore: (storeData: { id: string; name: string; }) => Promise<Store>;
  updateStore: (id: string, storeData: { id: string; name: string; }) => Promise<Store>;
  removeStore: (id: string) => Promise<boolean>;
  getUsersForStore: (storeId: string) => UserWithStore[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithStore | null>(null);
  const [users, setUsers] = useState<UserWithStore[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load stores from localStorage or initialize with defaults
  useEffect(() => {
    const savedStores = localStorage.getItem(AUTH_STORAGE_KEYS.STORES);
    if (savedStores) {
      try {
        const parsedStores = JSON.parse(savedStores);
        // Convert string dates back to Date objects
        const storesWithDates = parsedStores.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt)
        }));
        setStores(storesWithDates);
      } catch (error) {
        console.error('Failed to parse stored stores', error);
        setStores(INITIAL_STORES);
        localStorage.setItem(AUTH_STORAGE_KEYS.STORES, JSON.stringify(INITIAL_STORES));
      }
    } else {
      // Initialize with default stores
      setStores(INITIAL_STORES);
      localStorage.setItem(AUTH_STORAGE_KEYS.STORES, JSON.stringify(INITIAL_STORES));
    }
  }, []);

  // Load users from localStorage or initialize with defaults
  useEffect(() => {
    const savedUsers = localStorage.getItem(AUTH_STORAGE_KEYS.USERS);
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
        localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      }
    } else {
      // Initialize with default users
      setUsers(INITIAL_USERS);
      localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
  }, []);

  // Check for saved auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH);
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth);
        // Convert createdAt string back to Date object
        if (parsedAuth && typeof parsedAuth.createdAt === 'string') {
          parsedAuth.createdAt = new Date(parsedAuth.createdAt);
        }
        setUser(parsedAuth);
        
        // Set current store based on user's storeId
        if (parsedAuth && parsedAuth.storeId) {
          const userStore = stores.find(store => store.id === parsedAuth.storeId);
          if (userStore) {
            setCurrentStore(userStore);
          }
        }
      } catch (error) {
        console.error('Failed to parse stored auth', error);
        localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH);
      }
    }
    setIsLoading(false);
  }, [stores]);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }, [users]);

  // Save stores to localStorage whenever they change
  useEffect(() => {
    if (stores.length > 0) {
      localStorage.setItem(AUTH_STORAGE_KEYS.STORES, JSON.stringify(stores));
    }
  }, [stores]);

  // Get users for a specific store
  const getUsersForStore = (storeId: string): UserWithStore[] => {
    return users.filter(u => u.storeId === storeId);
  };

  // Add a new store
  const addStore = async (storeData: { id: string; name: string; }): Promise<Store> => {
    // Check if ID already exists
    if (stores.some(s => s.id === storeData.id)) {
      throw new Error('ID da loja já está em uso');
    }
    
    const newStore = {
      ...storeData,
      createdAt: new Date(),
    };
    
    setStores(prevStores => [...prevStores, newStore]);
    
    return newStore;
  };

  // Update an existing store
  const updateStore = async (id: string, storeData: { id: string; name: string; }): Promise<Store> => {
    // Check if new ID already exists and belongs to a different store
    if (storeData.id !== id && stores.some(s => s.id === storeData.id)) {
      throw new Error('ID da loja já está em uso');
    }
    
    const updatedStores = stores.map(s => {
      if (s.id === id) {
        return {
          ...s,
          id: storeData.id,
          name: storeData.name,
        };
      }
      return s;
    });
    
    setStores(updatedStores);
    
    const updatedStore = updatedStores.find(s => s.id === storeData.id);
    
    if (!updatedStore) {
      throw new Error('Loja não encontrada');
    }
    
    // Update current store if it was the one updated
    if (currentStore && currentStore.id === id) {
      setCurrentStore(updatedStore);
    }
    
    return updatedStore;
  };

  // Remove a store
  const removeStore = async (id: string): Promise<boolean> => {
    // Don't allow removing a store if it has users
    if (users.some(u => u.storeId === id)) {
      throw new Error('Não é possível remover uma loja que possui usuários');
    }
    
    setStores(prevStores => prevStores.filter(s => s.id !== id));
    
    // Reset current store if it was the one removed
    if (currentStore && currentStore.id === id) {
      setCurrentStore(null);
    }
    
    return true;
  };

  // Add a new user
  const addUser = async (userData: { 
    id: string;
    name: string; 
    email: string; 
    password: string; 
    role: UserRole;
    storeId: string;
  }): Promise<UserWithStore> => {
    // Check if email already exists
    if (users.some(u => u.email === userData.email)) {
      throw new Error('Email já está em uso');
    }
    
    // Check if ID already exists
    if (users.some(u => u.id === userData.id)) {
      throw new Error('ID já está em uso');
    }
    
    // Check if store exists
    if (!stores.some(s => s.id === userData.storeId)) {
      throw new Error('Loja não encontrada');
    }
    
    const newUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      storeId: userData.storeId,
      createdAt: new Date(),
    };
    
    setUsers(prevUsers => [...prevUsers, newUser]);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as UserWithStore;
  };

  // Update an existing user
  const updateUser = async (id: string, userData: { 
    id: string;
    name: string; 
    email: string; 
    role: UserRole;
    storeId: string;
    password?: string 
  }): Promise<UserWithStore> => {
    // Check if email already exists and belongs to a different user
    if (users.some(u => u.email === userData.email && u.id !== id)) {
      throw new Error('Email já está em uso');
    }
    
    // Check if new ID already exists and belongs to a different user
    if (userData.id !== id && users.some(u => u.id === userData.id)) {
      throw new Error('ID já está em uso');
    }
    
    // Check if store exists
    if (!stores.some(s => s.id === userData.storeId)) {
      throw new Error('Loja não encontrada');
    }
    
    const updatedUsers = users.map(u => {
      if (u.id === id) {
        // Create updated user object with new ID
        const updatedUser = { 
          ...u,
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          storeId: userData.storeId
        };
        
        // Update password only if it was provided
        if (userData.password) {
          updatedUser.password = userData.password;
        }
        
        // If this is the currently logged in user, update the auth state too
        if (user && user.id === id) {
          // Strip password from user state
          const { password, ...userWithoutPassword } = updatedUser;
          setUser(userWithoutPassword as UserWithStore);
          localStorage.setItem(AUTH_STORAGE_KEYS.AUTH, JSON.stringify(userWithoutPassword));
          
          // Update current store if store changed
          if (userWithoutPassword.storeId !== user.storeId) {
            const newStore = stores.find(s => s.id === userWithoutPassword.storeId);
            if (newStore) {
              setCurrentStore(newStore);
            }
          }
        }
        
        return updatedUser;
      }
      return u;
    });
    
    setUsers(updatedUsers);
    const updatedUser = updatedUsers.find(u => u.id === userData.id);
    
    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as UserWithStore;
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
        setUser(userWithoutPassword as UserWithStore);
        
        // Set current store
        const userStore = stores.find(store => store.id === foundUser.storeId);
        if (userStore) {
          setCurrentStore(userStore);
        }
        
        // Store in localStorage (will be replaced with tokens/session management)
        localStorage.setItem(AUTH_STORAGE_KEYS.AUTH, JSON.stringify(userWithoutPassword));
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
    setCurrentStore(null);
    localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH);
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
        stores,
        currentStore,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        addUser,
        updateUser,
        removeUser,
        addStore,
        updateStore,
        removeStore,
        getUsersForStore,
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

// Export the AuthContext storage keys for use in other components
export const authStorageKeys = AUTH_STORAGE_KEYS;

