
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

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

  useEffect(() => {
    storageService.setItem(STORAGE_KEYS.CART, cart);
  }, [cart]);

  const addProductToCart = (product: Product, qty: number) => {
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
    setCart(cart.filter(item => item.id !== productId));
    toast({
      title: "Produto removido",
      description: "Item removido do carrinho"
    });
  };

  const clearCart = () => {
    setCart([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos"
    });
  };

  const cartSubtotal = cart.reduce((total, item) => total + item.subtotal, 0);

  return {
    cart,
    cartSubtotal,
    addProductToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    setCart
  };
};
