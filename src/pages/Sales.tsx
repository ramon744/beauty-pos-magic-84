
import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Trash2, 
  CreditCard, 
  Receipt, 
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { useIsMobile } from '@/hooks/use-mobile';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

// Mock products for demonstration
const mockProducts: Product[] = [
  { id: '1', name: 'Batom Matte Vermelho', description: 'Batom de longa duração', price: 29.90, stock: 15, category: 'Lábios' },
  { id: '2', name: 'Base Líquida Natural', description: 'Base para todos os tipos de pele', price: 89.90, stock: 8, category: 'Rosto' },
  { id: '3', name: 'Máscara de Cílios Volume', description: 'Máscara para volume', price: 59.90, stock: 12, category: 'Olhos' },
  { id: '4', name: 'Pó Compacto Translúcido', description: 'Pó para fixação', price: 49.90, stock: 10, category: 'Rosto' },
  { id: '5', name: 'Delineador Líquido Preto', description: 'Delineador à prova d\'água', price: 39.90, stock: 20, category: 'Olhos' },
  { id: '6', name: 'Blush Rosado', description: 'Blush em pó', price: 45.90, stock: 7, category: 'Rosto' },
  { id: '7', name: 'Paleta de Sombras', description: 'Paleta com 12 cores', price: 120.00, stock: 5, category: 'Olhos' },
];

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Filter products based on search query
  const filteredProducts = mockProducts.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.id.includes(searchQuery)
  );

  // Add product to cart
  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const existingItem = cart.find(item => item.id === selectedProduct.id);
    
    if (existingItem) {
      // Update existing item
      setCart(cart.map(item => 
        item.id === selectedProduct.id
          ? { 
              ...item, 
              quantity: item.quantity + quantity,
              subtotal: (item.quantity + quantity) * item.price
            }
          : item
      ));
    } else {
      // Add new item
      setCart([...cart, {
        ...selectedProduct,
        quantity,
        subtotal: quantity * selectedProduct.price
      }]);
    }
    
    // Reset selection and quantity
    setSelectedProduct(null);
    setQuantity(1);
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
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
        <div className="text-center">{row.original.quantity}</div>
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
            onClick={() => removeFromCart(row.original.id)}
            className="text-destructive hover:text-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Product search/selection columns
  const productColumns: ColumnDef<Product>[] = [
    {
      accessorKey: 'id',
      header: 'Código',
    },
    {
      accessorKey: 'name',
      header: 'Produto',
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
    },
    {
      accessorKey: 'price',
      header: 'Preço',
      cell: ({ row }) => (
        <div className="text-right">R$ {row.original.price.toFixed(2)}</div>
      ),
    },
    {
      accessorKey: 'stock',
      header: 'Estoque',
      cell: ({ row }) => (
        <div className={`text-center ${row.original.stock < 5 ? 'text-destructive' : ''}`}>
          {row.original.stock}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProduct(row.original);
              setQuantity(1);
            }}
            className="text-primary hover:text-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      ),
    },
  ];

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
              <CardTitle className="text-lg flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Buscar Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4">
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="rounded-md border">
                <DataTable
                  columns={productColumns}
                  data={filteredProducts}
                />
              </div>
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

        {/* Side panel - selected product and checkout */}
        <div className={`space-y-6 ${isMobile ? 'col-span-5' : 'col-span-2'}`}>
          {/* Selected product */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Produto Selecionado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProduct ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Preço unitário:</span>
                    <span className="font-medium">R$ {selectedProduct.price.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Estoque disponível:</span>
                    <span className={`font-medium ${selectedProduct.stock < 5 ? 'text-destructive' : ''}`}>
                      {selectedProduct.stock} unidades
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <label htmlFor="quantity" className="text-sm">Quantidade:</label>
                    <Input
                      id="quantity"
                      type="number"
                      min={1}
                      max={selectedProduct.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    
                    <Button onClick={addToCart} className="ml-auto">
                      <Plus className="mr-1 h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Selecione um produto para adicionar ao carrinho
                </div>
              )}
            </CardContent>
          </Card>
          
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
                  onClick={() => setCart([])}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Sales;
