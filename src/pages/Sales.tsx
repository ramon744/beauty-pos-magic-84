
import React, { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Check, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Product, CartItem, PaymentMethod } from '@/types';

// Mock products for demonstration
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Base Líquida Matte',
    description: 'Base líquida de alta cobertura com acabamento matte',
    code: 'B001',
    category: { id: '1', name: 'Base' },
    salePrice: 89.90,
    costPrice: 45.00,
    stock: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Batom Líquido Vermelho',
    description: 'Batom líquido longa duração cor vermelho intenso',
    code: 'BL001',
    category: { id: '2', name: 'Batom' },
    salePrice: 59.90,
    costPrice: 30.00,
    stock: 20,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Paleta de Sombras Nude',
    description: 'Paleta com 12 cores em tons neutros',
    code: 'PS001',
    category: { id: '3', name: 'Sombra' },
    salePrice: 120.00,
    costPrice: 65.00,
    stock: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const searchProducts = (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      const results = mockProducts.filter(
        product => 
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.code.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      // Increase quantity of existing item
      setCartItems(
        cartItems.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new item
      setCartItems([
        ...cartItems,
        { 
          product,
          quantity: 1,
          price: product.salePrice,
          discount: 0
        }
      ]);
    }
    
    // Clear search results
    setSearchTerm('');
    setSearchResults([]);
    
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const updateQuantity = (id: string, change: number) => {
    setCartItems(
      cartItems.map(item => {
        if (item.product.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const updateDiscount = (id: string, discountValue: number) => {
    setCartItems(
      cartItems.map(item => {
        if (item.product.id === id) {
          return { ...item, discount: discountValue };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== id));
    toast.info("Item removido do carrinho");
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateItemDiscount = (item: CartItem) => {
    return (item.discount / 100) * (item.price * item.quantity);
  };

  const calculateTotalDiscount = () => {
    const itemDiscounts = cartItems.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
    return itemDiscounts + totalDiscount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateTotalDiscount();
    return subtotal - discount;
  };

  const handleFinishSale = (paymentMethod: PaymentMethod) => {
    if (cartItems.length === 0) {
      toast.error("Adicione produtos ao carrinho para finalizar a venda");
      return;
    }
    
    // Here we would normally process the sale through an API
    // For demo purposes, we'll just show a success message
    toast.success(`Venda finalizada com sucesso! Forma de pagamento: ${getPaymentMethodName(paymentMethod)}`);
    
    // Reset the cart
    setCartItems([]);
    setTotalDiscount(0);
    setShowPaymentMethods(false);
  };

  const getPaymentMethodName = (method: PaymentMethod): string => {
    const methods: Record<PaymentMethod, string> = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      transfer: 'Transferência',
    };
    return methods[method];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side - Product search and cart */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Pesquisar Produtos</CardTitle>
            <CardDescription>Pesquise por nome ou código do produto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o nome ou código do produto..."
                value={searchTerm}
                onChange={(e) => searchProducts(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-md overflow-hidden shadow-sm max-h-[300px] overflow-y-auto">
                <div className="divide-y">
                  {searchResults.map(product => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer"
                      onClick={() => addToCart(product)}
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Código: {product.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {product.salePrice.toFixed(2).replace('.', ',')}</p>
                        <p className="text-sm text-muted-foreground">Estoque: {product.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Carrinho de Compras</CardTitle>
              <div className="flex items-center text-muted-foreground">
                <ShoppingCart className="h-5 w-5 mr-2" />
                <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} itens</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Carrinho vazio</p>
                <p className="text-sm">Adicione produtos para iniciar uma venda</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-6">Produto</div>
                  <div className="col-span-2 text-center">Qtd</div>
                  <div className="col-span-2 text-center">Desconto</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                </div>
                <Separator />
                
                {cartItems.map(item => {
                  const itemSubtotal = item.price * item.quantity;
                  const itemDiscount = calculateItemDiscount(item);
                  const itemTotal = itemSubtotal - itemDiscount;
                  
                  return (
                    <div key={item.product.id} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-6">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          R$ {item.price.toFixed(2).replace('.', ',')} / un
                        </div>
                      </div>
                      
                      <div className="col-span-2 flex items-center justify-center space-x-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.product.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="col-span-2 flex items-center justify-center">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount}
                          onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                          className="h-8 w-16 text-center"
                        />
                        <span className="ml-1">%</span>
                      </div>
                      
                      <div className="col-span-1 text-right font-medium">
                        R$ {itemTotal.toFixed(2).replace('.', ',')}
                      </div>
                      
                      <div className="col-span-1 flex justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Desconto adicional (R$)</span>
                      <Input
                        type="number"
                        min="0"
                        value={totalDiscount}
                        onChange={(e) => setTotalDiscount(parseFloat(e.target.value) || 0)}
                        className="h-8 w-24 text-right"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-right">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>R$ {calculateSubtotal().toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto total:</span>
                      <span>- R$ {calculateTotalDiscount().toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-2">
                      <span>Total:</span>
                      <span>R$ {calculateTotal().toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Payment and customer info */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Finalizar Venda</CardTitle>
            <CardDescription>Informações do cliente e pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente (opcional)</label>
              <Input placeholder="Pesquisar cliente por nome ou CPF" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas da Venda (opcional)</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border p-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Adicione observações para esta venda..."
              ></textarea>
            </div>
            
            <div className="p-4 rounded-lg bg-muted">
              <h3 className="text-lg font-semibold mb-2">Resumo da Venda</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Quantidade de Itens:</span>
                  <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {calculateSubtotal().toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Desconto Total:</span>
                  <span>- R$ {calculateTotalDiscount().toFixed(2).replace('.', ',')}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total a Pagar:</span>
                  <span>R$ {calculateTotal().toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {!showPaymentMethods ? (
              <Button 
                className="w-full" 
                disabled={cartItems.length === 0}
                onClick={() => setShowPaymentMethods(true)}
              >
                <Check className="mr-2 h-4 w-4" />
                Prosseguir para Pagamento
              </Button>
            ) : (
              <div className="space-y-3 w-full">
                <h3 className="font-medium">Selecione a forma de pagamento:</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleFinishSale('credit_card')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cartão de Crédito
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleFinishSale('debit_card')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Cartão de Débito
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleFinishSale('cash')}
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    Dinheiro
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => handleFinishSale('pix')}
                  >
                    <Smartphone className="mr-2 h-4 w-4" />
                    PIX
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-2"
                  onClick={() => setShowPaymentMethods(false)}
                >
                  Voltar
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Sales;
