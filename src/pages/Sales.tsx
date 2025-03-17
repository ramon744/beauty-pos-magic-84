import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  X,
  Percent,
  Tag,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { ColumnDef } from '@tanstack/react-table';
import { useIsMobile } from '@/hooks/use-mobile';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScan } from '@/hooks/use-barcode-scan';
import { useFetchProducts } from '@/hooks/use-products';
import { useFetchPromotions } from '@/hooks/use-promotions';
import { Product, CartItem as CartItemType } from '@/types';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';
import { PromotionSelectionDialog } from '@/components/sales/PromotionSelectionDialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  getAvailablePromotions, 
  getBestPromotion, 
  calculatePromotionDiscount,
  formatPromotionBadge,
  AppliedPromotion 
} from '@/utils/promotions-utils';
import { Badge } from '@/components/ui/badge';

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

const discountFormSchema = z.object({
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number()
    .min(0, 'O valor do desconto deve ser maior que zero')
    .max(100, { message: 'O percentual de desconto não pode ser maior que 100%' })
});

type DiscountFormValues = z.infer<typeof discountFormSchema>;

const Sales = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Omit<CartItem, 'quantity' | 'subtotal'>[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = storageService.getItem<CartItem[]>(STORAGE_KEYS.CART);
    return savedCart || [];
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [manualDiscount, setManualDiscount] = useState<{type: 'percentage' | 'fixed', value: number} | null>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  
  const { data: products = [] } = useFetchProducts();
  const { data: promotions = [] } = useFetchPromotions();

  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      discountType: 'percentage',
      discountValue: 0
    }
  });

  const cartItemsForPromotions = useMemo(() => {
    return cart.map(item => {
      const product = products.find(p => p.id === item.id);
      return {
        product: product ? { 
          ...product, 
          category: { id: product.category.id, name: product.category.name } 
        } : {
          id: item.id,
          name: item.name,
          description: item.description,
          salePrice: item.price,
          costPrice: 0,
          stock: item.stock,
          code: '',
          category: { id: '', name: item.category },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        quantity: item.quantity,
        price: item.price,
        discount: 0
      };
    });
  }, [cart, products]);

  const availablePromotions = useMemo(() => {
    if (cart.length === 0) return [];
    const promos = getAvailablePromotions(cartItemsForPromotions, promotions);
    if (promos.length > 1 && !selectedPromotionId && cart.length > 0 && !isPromotionDialogOpen) {
      return promos;
    }
    return promos;
  }, [cartItemsForPromotions, promotions, cart.length, selectedPromotionId, isPromotionDialogOpen]);

  const appliedPromotion = useMemo((): AppliedPromotion | null => {
    if (cart.length === 0 || availablePromotions.length === 0) return null;
    
    if (selectedPromotionId) {
      const selectedPromotion = availablePromotions.find(p => p.id === selectedPromotionId);
      if (selectedPromotion) {
        return calculatePromotionDiscount(cartItemsForPromotions, selectedPromotion, products);
      }
      return null;
    }
    
    return getBestPromotion(cartItemsForPromotions, availablePromotions, products);
  }, [cartItemsForPromotions, availablePromotions, selectedPromotionId, products]);

  const promotionDiscountAmount = useMemo(
    () => appliedPromotion?.discountAmount || 0,
    [appliedPromotion]
  );

  const appliedPromotionDetails = useMemo(() => {
    if (!appliedPromotion) return null;
    const promotion = promotions.find(p => p.id === appliedPromotion.promotionId);
    return promotion || null;
  }, [appliedPromotion, promotions]);

  React.useEffect(() => {
    storageService.setItem(STORAGE_KEYS.CART, cart);
  }, [cart]);

  const handleBarcodeDetected = (barcode: string) => {
    toast({
      title: "Código de barras detectado",
      description: `Código: ${barcode}`,
    });
    
    const product = products.find(p => p.code === barcode);
    
    if (product) {
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

  const { startScanning, stopScanning, isScanning } = useBarcodeScan(handleBarcodeDetected);

  useEffect(() => {
    if (isScanning) {
      startScanning();
    }
  }, []);

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

  const addProductToCart = (product: Omit<CartItem, 'quantity' | 'subtotal'>, qty: number) => {
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
    if (newQuantity <= 0) {
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

  const initiateRemoveFromCart = (productId: string) => {
    setProductIdToDelete(productId);
    setIsManagerAuthOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    toast({
      title: "Produto removido",
      description: "Item removido do carrinho"
    });
  };

  const handleManagerAuthConfirm = () => {
    if (productIdToDelete === "discount") {
      const { discountType, discountValue } = discountForm.getValues();
      setManualDiscount({
        type: discountType,
        value: discountValue
      });
      
      toast({
        title: "Desconto aplicado",
        description: discountType === 'percentage' 
          ? `Desconto de ${discountValue}% aplicado`
          : `Desconto de R$ ${discountValue.toFixed(2)} aplicado`
      });
    } else if (productIdToDelete === "clear-all") {
      doClearCart();
    } else if (productIdToDelete) {
      removeFromCart(productIdToDelete);
    }
    
    setProductIdToDelete(null);
  };

  const cartSubtotal = cart.reduce((total, item) => total + item.subtotal, 0);
  
  const manualDiscountAmount = manualDiscount 
    ? manualDiscount.type === 'percentage' 
      ? (cartSubtotal * manualDiscount.value / 100) 
      : Math.min(manualDiscount.value, cartSubtotal)
    : 0;
  
  const totalDiscountAmount = manualDiscountAmount + promotionDiscountAmount;
  const cartTotal = cartSubtotal - totalDiscountAmount;

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

  const clearCart = () => {
    if (cart.length > 0) {
      setProductIdToDelete("clear-all");
      setIsManagerAuthOpen(true);
    }
  };
  
  const doClearCart = () => {
    setCart([]);
    setManualDiscount(null);
    setSelectedPromotionId(null);
    toast({
      title: "Carrinho limpo",
      description: "Todos os itens foram removidos"
    });
  };

  const finalizeSale = () => {
    toast({
      title: "Venda finalizada",
      description: `Total: R$ ${cartTotal.toFixed(2)}`
    });
    doClearCart();
  };

  const handleAddDiscount = () => {
    discountForm.reset({
      discountType: 'percentage',
      discountValue: 0
    });
    setIsDiscountDialogOpen(true);
  };

  const handleSubmitDiscount = (values: DiscountFormValues) => {
    setIsDiscountDialogOpen(false);
    setProductIdToDelete("discount");
    setIsManagerAuthOpen(true);
  };

  const removeDiscount = () => {
    setManualDiscount(null);
    toast({
      title: "Desconto removido",
      description: "Desconto manual removido da venda"
    });
  };

  const handleOpenPromotions = () => {
    setIsPromotionDialogOpen(true);
  };

  const handleSelectPromotion = (promotionId: string | null) => {
    setSelectedPromotionId(promotionId);
  };

  const removePromotion = () => {
    setSelectedPromotionId(null);
    toast({
      title: "Promoção removida",
      description: "Promoção automática removida da venda"
    });
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
        <div className={`space-y-6 ${isMobile ? 'col-span-5' : 'col-span-3'}`}>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Itens no Carrinho
                </div>
                {availablePromotions.length > 0 && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 cursor-pointer bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200"
                    onClick={handleOpenPromotions}
                  >
                    <Gift className="mr-1 h-3 w-3" />
                    {formatPromotionBadge(availablePromotions.length)}
                  </Badge>
                )}
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

        <div className={`space-y-6 ${isMobile ? 'col-span-5' : 'col-span-2'}`}>
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
                
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal:</span>
                  <span>R$ {cartSubtotal.toFixed(2)}</span>
                </div>
                
                {appliedPromotionDetails && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-medium flex items-center">
                      <Gift className="mr-1 h-4 w-4" />
                      Promoção: {appliedPromotionDetails.name}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-1 text-green-600"
                        onClick={removePromotion}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </span>
                    <span>- R$ {promotionDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {manualDiscount && (
                  <div className="flex justify-between text-destructive">
                    <span className="font-medium flex items-center">
                      <Percent className="mr-1 h-4 w-4" />
                      Desconto {manualDiscount.type === 'percentage' ? `(${manualDiscount.value}%)` : ''}:
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-1 text-destructive"
                        onClick={removeDiscount}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </span>
                    <span>- R$ {manualDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {(manualDiscountAmount > 0 || promotionDiscountAmount > 0) && (
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Economia Total:</span>
                    <span className="text-green-600">R$ {totalDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
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
                  onClick={handleAddDiscount}
                >
                  <Percent className="mr-1 h-4 w-4" />
                  Desconto
                </Button>
                
                <Button 
                  variant={availablePromotions.length > 0 ? "outline" : "ghost"} 
                  className={`flex-1 ${availablePromotions.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={availablePromotions.length === 0}
                  onClick={handleOpenPromotions}
                >
                  <Gift className="mr-1 h-4 w-4" />
                  Promoções
                  {availablePromotions.length > 0 && (
                    <Badge className="ml-1 bg-amber-100 text-amber-800 border-amber-200">
                      {availablePromotions.length}
                    </Badge>
                  )}
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

      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={() => {
          setIsManagerAuthOpen(false);
          setProductIdToDelete(null);
        }}
        onConfirm={handleManagerAuthConfirm}
        title="Autenticação Gerencial"
        description="Esta operação requer autorização de um gerente ou administrador."
      />

      <ManagerAuthDialog
        isOpen={isDiscountDialogOpen}
        onClose={() => setIsDiscountDialogOpen(false)}
        onConfirm={discountForm.handleSubmit(handleSubmitDiscount)}
        title="Adicionar Desconto"
        description="Configure o tipo e valor do desconto a ser aplicado."
        customFormId="discount-form"
        customContent={
          <Form {...discountForm}>
            <form id="discount-form" onSubmit={discountForm.handleSubmit(handleSubmitDiscount)} className="space-y-4 py-4">
              <FormField
                control={discountForm.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Tipo de Desconto</FormLabel>
                    <div className="flex gap-4">
                      <FormControl>
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="percentage" 
                            value="percentage"
                            checked={field.value === 'percentage'}
                            onChange={() => field.onChange('percentage')}
                            className="mr-2" 
                          />
                          <label htmlFor="percentage">Percentual (%)</label>
                        </div>
                      </FormControl>
                      <FormControl>
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            id="fixed" 
                            value="fixed"
                            checked={field.value === 'fixed'}
                            onChange={() => field.onChange('fixed')}
                            className="mr-2" 
                          />
                          <label htmlFor="fixed">Valor Fixo (R$)</label>
                        </div>
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={discountForm.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {discountForm.watch('discountType') === 'percentage' 
                        ? 'Percentual de Desconto (%)' 
                        : 'Valor do Desconto (R$)'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max={discountForm.watch('discountType') === 'percentage' ? "100" : undefined}
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        }
      />

      <PromotionSelectionDialog
        isOpen={isPromotionDialogOpen}
        onClose={() => setIsPromotionDialogOpen(false)}
        promotions={availablePromotions}
        selectedPromotionId={selectedPromotionId}
        onSelectPromotion={handleSelectPromotion}
        products={products}
      />
    </div>
  );
};

export default Sales;
