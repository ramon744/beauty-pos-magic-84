
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { Customer } from '@/types';

export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  quantity: number;
  subtotal: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

export const useCart = () => {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = storageService.getItem<CartItem[]>(STORAGE_KEYS.CART);
    return savedCart || [];
  });
  
  // Adicionar estado para o cliente associado à venda
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(() => {
    const savedCustomer = storageService.getItem<Customer>(STORAGE_KEYS.CART_CUSTOMER);
    return savedCustomer;
  });

  // Verificar conexão online
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Atualizar estado de online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "Conexão perdida",
        description: "Você está offline. O aplicativo precisa de conexão com a internet para funcionar."
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    storageService.setItem(STORAGE_KEYS.CART, cart);
  }, [cart]);
  
  // Salvar o cliente vinculado no localStorage
  useEffect(() => {
    if (linkedCustomer) {
      storageService.setItem(STORAGE_KEYS.CART_CUSTOMER, linkedCustomer);
    } else {
      storageService.removeItem(STORAGE_KEYS.CART_CUSTOMER);
    }
  }, [linkedCustomer]);

  const addProductToCart = (product: Product, qty: number) => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível adicionar produtos ao carrinho offline."
      });
      return;
    }
    
    if (!product || qty <= 0) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id
          ? { 
              ...item, 
              quantity: item.quantity + qty,
              subtotal: (item.quantity + qty) * item.price
            }
          : item
      ));
      
      toast({
        title: "Produto atualizado",
        description: `${product.name} (${qty}) adicionado ao carrinho`
      });
    } else {
      setCart([...cart, {
        ...product,
        quantity: qty,
        subtotal: qty * product.price
      }]);
      
      toast({
        title: "Produto adicionado",
        description: `${product.name} adicionado ao carrinho`
      });
    }
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível atualizar o carrinho offline."
      });
      return productId;
    }
    
    if (newQuantity <= 0) return productId; // Return the productId to handle removal elsewhere
    
    setCart(cart.map(item => 
      item.id === productId
        ? { 
            ...item, 
            quantity: newQuantity,
            subtotal: newQuantity * item.price
          }
        : item
    ));
    
    return null; // No product to remove
  };

  const removeFromCart = (productId: string) => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível remover itens do carrinho offline."
      });
      return;
    }
    
    setCart(cart.filter(item => item.id !== productId));
    toast({
      title: "Produto removido",
      description: "Item removido do carrinho"
    });
  };

  const clearCart = () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível limpar o carrinho offline."
      });
      return;
    }
    
    setCart([]);
    setLinkedCustomer(null);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos"
    });
  };

  const linkCustomer = (customer: Customer) => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível vincular cliente offline."
      });
      return;
    }
    
    setLinkedCustomer(customer);
    toast({
      title: "Cliente vinculado",
      description: `${customer.name} foi vinculado à venda`
    });
  };

  const unlinkCustomer = () => {
    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: "Não é possível desvincular cliente offline."
      });
      return;
    }
    
    setLinkedCustomer(null);
    toast({
      title: "Cliente removido",
      description: "Cliente foi desvinculado da venda"
    });
  };

  const cartSubtotal = cart.reduce((total, item) => total + item.subtotal, 0);

  return {
    cart,
    cartSubtotal,
    linkedCustomer,
    isOnline,
    addProductToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    linkCustomer,
    unlinkCustomer,
    setCart
  };
};
