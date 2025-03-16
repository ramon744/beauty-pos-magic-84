
import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus,
  Trash2, 
  CreditCard, 
  Receipt, 
  Barcode,
  Camera,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { useIsMobile } from '@/hooks/use-mobile';
import { storageService } from '@/services/storage-service';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScan } from '@/hooks/use-barcode-scan';
import { useFetchProducts } from '@/hooks/use-products';
import { Product } from '@/types';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  quantity: number;
  subtotal: number;
}

const CART_STORAGE_KEY = 'makeup-pos-cart';

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Omit<CartItem, 'quantity' | 'subtotal'>[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = storageService.getItem<CartItem[]>(CART_STORAGE_KEY);
    return savedCart || [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Manager auth dialog state
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  
  // Fetch products from the database
  const { data: products = [] } = useFetchProducts();

  // Save cart to local storage whenever it changes
  React.useEffect(() => {
    storageService.setItem(CART_STORAGE_KEY, cart);
  }, [cart]);

  // Handle barcode scanning
  const handleBarcodeDetected = (barcode: string) => {
    toast({
      title: "Código de barras detectado",
      description: `Código: ${barcode}`,
    });
    
    // Search for product with the scanned barcode (using code field for actual implementation)
    const product = products.find(p => p.code === barcode);
    
    if (product) {
      // Automatically add the product to the cart with quantity 1
      const productToAdd = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.salePrice,
        stock: product.stock,
        category: product.category.name
      };
      
      addProductToCart(productToAdd, 1);
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Nenhum produto encontrado com o código ${barcode}`,
        variant: "destructive"
      });
    }
  };

  // Use custom hook for barcode scanning
  const { startScanning, stopScanning, isScanning } = useBarcodeScan(handleBarcodeDetected);

  // Effect to activate scanner on component mount if it was previously active
  useEffect(() => {
    if (isScanning) {
      startScanning();
    }
  }, []);

  // Toggle barcode scanner
  const toggleScanner = () => {
    if (isScanning) {
      stopScanning();
      toast({
        title: "Leitor de código de barras desativado",
      });
    } else {
      startScanning();
      toast({
        title: "Leitor de código de barras ativado",
        description: "Posicione o código de barras na frente da câmera"
      });
    }
  };

  // Search products as user types
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.includes(searchQuery)
      );
      
      setSearchResults(results.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.salePrice,
        stock: p.stock,
        category: p.category.name
      })));
      
      setHasSearched(true);
      
      if (results.length === 0 && searchQuery.trim().length > 2) {
        toast({
          title: "Nenhum produto encontrado",
          description: "Tente outro termo de busca",
          variant: "destructive"
        });
      }
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchQuery, products, toast]);

  // Add product to cart
  const addProductToCart = (product: Omit<CartItem, 'quantity' | 'subtotal'>, qty: number) => {
    if (!product || qty <= 0) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update existing item
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
      // Add new item
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

  // Update cart item quantity
  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // If removing via quantity reduction, also require manager auth
      setProductIdToDelete(productId);
      setIsManagerAuthOpen(true);
      return;
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
  };

  // Initialize product removal process - opens manager auth dialog
  const initiateRemoveFromCart = (productId: string) => {
    // Only employees need manager authorization
    if (user?.role === "employee") {
      setProductIdToDelete(productId);
      setIsManagerAuthOpen(true);
    } else {
      // Managers and admins can delete without authorization
      removeFromCart(productId);
    }
  };

  // Remove item from cart - called after auth or directly for managers/admins
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    toast({
      title: "Produto removido",
      description: "Item removido do carrinho"
    });
  };

  // Handle manager auth confirmation
  const handleManagerAuthConfirm = () => {
    if (productIdToDelete) {
      removeFromCart(productIdToDelete);
      setProductIdToDelete(null);
    }
  };

  // Calculate total
  const cartTotal = cart.reduce((total, item) => total + item.subtotal, 0);

  // Cart item columns for DataTable
  const cartColumns: ColumnDef<CartItem>[] = [
    {
      accessorKey: 'name',
      header: 'Produto',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Qtd',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => updateCartItemQuantity(row.original.id, row.original.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center">{row.original.quantity}</span>
          <Button 
            variant="outline" 
            size="icon"
            className="h-7 w-7" 
            onClick={() => updateCartItemQuantity(row.original.id, row.original.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }) => (
        <div className="text-right">R$ {row.original.price.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: 'subtotal',
      header: 'Subtotal',
      cell: ({ row }) => (
        <div className="text-right font-medium">R$ {row.original.subtotal.toFixed(2)}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => initiateRemoveFromCart(row.original.id)}
            className="text-destructive hover:text-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Simplified product columns - only showing name, price and add button
  const productColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Produto',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }) => (
        <div className="text-right">R$ {row.original.price.toFixed(2)}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => addProductToCart(row.original, 1)}
            className="text-primary hover:text-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      ),
    },
  ];

  // Clear cart
  const clearCart = () => {
    // For employees, require manager auth to clear cart
    if (user?.role === "employee" && cart.length > 0) {
      // Special case - we're using productIdToDelete as a flag to indicate clearing the cart
      setProductIdToDelete("clear-all");
      setIsManagerAuthOpen(true);
    } else {
      // Managers and admins can clear without authorization
      doClearCart();
    }
  };
  
  // Actually perform the cart clearing
  const doClearCart = () => {
    setCart([]);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos"
    });
  };

  // Finalize sale (placeholder)
  const finalizeSale = () => {
    toast({
      title: "Venda finalizada",
      description: `Total: R$ ${cartTotal.toFixed(2)}`
    });
    // Here you would handle saving the sale to database
    doClearCart();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <ShoppingCart className="mr-2 h-8 w-8" />
          Nova Venda
        </h2>
        <p className="text-muted-foreground">
          <span className="font-medium">Atendente: {user?.name}</span> • 
          {new Date().toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Main content - product search and cart */}
        <div className={`space-y-6 ${isMobile ? 'col-span-5' : 'col-span-3'}`}>
          {/* Product search */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Search className="mr-2 h-5 w-5" />
                  Buscar Produtos
                </div>
                <Button 
                  onClick={toggleScanner} 
                  variant={isScanning ? "destructive" : "outline"}
                  size="sm"
                  className="ml-auto"
                >
                  {isScanning ? (
                    <>
                      <X className="mr-1 h-4 w-4" />
                      Desativar Scanner
                    </>
                  ) : (
                    <>
                      <Barcode className="mr-1 h-4 w-4" />
                      Leitor de Código
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar por nome, código ou SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              {isScanning && (
                <div className="mb-4 p-4 border rounded-md bg-muted/20">
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="text-center flex-1">
                      <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Posicione o código de barras na frente da câmera
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {searchQuery.trim() && (
                <>
                  {searchResults.length > 0 ? (
                    <div className="rounded-md border">
                      <DataTable
                        columns={productColumns}
                        data={searchResults}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      Nenhum produto encontrado. Tente outra busca.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Cart items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Itens no Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length > 0 ? (
                <div className="rounded-md border">
                  <DataTable
                    columns={cartColumns}
                    data={cart}
                  />
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Carrinho vazio. Adicione produtos para iniciar a venda.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side panel - checkout */}
        <div className={`space-y-6 ${isMobile ? 'col-span-5' : 'col-span-2'}`}>
          {/* Checkout */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumo da Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">Total de Itens:</span>
                  <span>{cart.reduce((total, item) => total + item.quantity, 0)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                size="lg" 
                disabled={cart.length === 0}
                onClick={finalizeSale}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Finalizar Venda
              </Button>
              
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  disabled={cart.length === 0}
                >
                  <Receipt className="mr-1 h-4 w-4" />
                  Salvar
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  disabled={cart.length === 0}
                  onClick={clearCart}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Manager Authentication Dialog */}
      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={() => {
          setIsManagerAuthOpen(false);
          setProductIdToDelete(null);
        }}
        onConfirm={() => {
          if (productIdToDelete === "clear-all") {
            doClearCart();
          } else {
            handleManagerAuthConfirm();
          }
        }}
        title="Autenticação Gerencial"
        description="Esta operação requer autorização de um gerente ou administrador."
      />
    </div>
  );
};

export default Sales;
