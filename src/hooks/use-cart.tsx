
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { Product as ProductType } from '@/types';

// Extended CartItem with needed fields for the cart functionality
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

// Simplified product interface for cart operations
export interface CartProduct {
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

  // Convert from the main Product type to CartProduct
  const adaptProductForCart = (product: ProductType): CartProduct => {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.salePrice,
      stock: product.stock,
      category: product.category.name
    };
  };

  const addProductToCart = (product: ProductType | CartProduct, qty: number) => {
    if (!product || qty <= 0) return;
    
    // Ensure we have the correct product format
    const cartProduct = 'salePrice' in product ? adaptProductForCart(product as ProductType) : product;
    
    const existingItem = cart.find(item => item.id === cartProduct.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === cartProduct.id
          ? { 
              ...item, 
              quantity: item.quantity + qty,
              subtotal: (item.quantity + qty) * item.price
            }
          : item
      ));
      
      toast({
        title: "Produto atualizado",
        description: `${cartProduct.name} (${qty}) adicionado ao carrinho`
      });
    } else {
      setCart([...cart, {
        ...cartProduct,
        quantity: qty,
        subtotal: qty * cartProduct.price
      }]);
      
      toast({
        title: "Produto adicionado",
        description: `${cartProduct.name} adicionado ao carrinho`
      });
    }
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Se a quantidade for zero ou negativa, remova o item
      removeFromCart(productId);
      return null;
    }
    
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
    // Encontre o item para usar seu nome na mensagem toast
    const itemToRemove = cart.find(item => item.id === productId);
    
    // Filtre o carrinho para remover o item
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    
    // Exiba a mensagem toast com o nome do item se disponível
    toast({
      title: "Produto removido",
      description: itemToRemove 
        ? `${itemToRemove.name} removido do carrinho` 
        : "Item removido do carrinho"
    });
  };

  const clearCart = () => {
    // Salve uma cópia do carrinho atual antes de limpá-lo
    const currentCart = [...cart];
    
    // Limpe o carrinho
    setCart([]);
    
    // Exiba o toast apenas se havia itens no carrinho
    if (currentCart.length > 0) {
      toast({
        title: "Carrinho limpo",
        description: `${currentCart.length} item(s) removido(s) do carrinho`
      });
    }
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
