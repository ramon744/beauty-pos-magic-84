import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetchPromotion, useSavePromotion } from '@/hooks/use-promotions';
import { useFetchProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-products';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Promotion, PromotionType } from '@/types';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { X, Calendar as CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// Define the form schema with conditional fields based on promotion type
const promotionFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().min(5, { message: 'Descrição deve ter pelo menos 5 caracteres' }),
  type: z.enum(['discount_percentage', 'discount_value', 'buy_x_get_y', 'fixed_price', 'bundle']),
  discountPercent: z.coerce.number().optional(),
  discountValue: z.coerce.number().optional(),
  fixedPrice: z.coerce.number().optional(),
  buyQuantity: z.coerce.number().optional(),
  getQuantity: z.coerce.number().optional(),
  secondaryProductId: z.string().optional(),
  secondaryProductDiscount: z.coerce.number().optional(),
  bundlePrice: z.coerce.number().optional(),
  productId: z.string().optional(),
  productIds: z.array(z.string()).optional(), // Added array of product IDs
  categoryId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  bundleProducts: z.array(z.string()).optional(),
}).refine(data => {
  if (data.type === 'discount_percentage' && !data.discountPercent) {
    return false;
  }
  if (data.type === 'discount_value' && !data.discountValue) {
    return false;
  }
  if (data.type === 'fixed_price' && !data.fixedPrice) {
    return false;
  }
  if (data.type === 'buy_x_get_y' && (!data.buyQuantity || !data.getQuantity)) {
    return false;
  }
  if (data.type === 'bundle' && (!data.bundlePrice || !data.bundleProducts || data.bundleProducts.length < 2)) {
    return false;
  }
  
  // Validate that target (product or category) is selected for certain promotion types
  if (['discount_percentage', 'discount_value'].includes(data.type)) {
    // Either one product, multiple products, or a category must be selected
    if (!data.productId && (!data.productIds || data.productIds.length === 0) && !data.categoryId) {
      return false;
    }
  }
  
  // Product is required for specific promotion types
  if (['buy_x_get_y', 'fixed_price'].includes(data.type) && !data.productId) {
    return false;
  }
  
  // Validate date range
  return data.startDate <= data.endDate;
}, {
  message: "Todos os campos obrigatórios para esse tipo de promoção devem ser preenchidos corretamente.",
  path: ["type"]
});

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

interface PromotionFormProps {
  promotionId: string | null;
  onSubmitted: () => void;
}

export default function PromotionForm({ promotionId, onSubmitted }: PromotionFormProps) {
  const { toast } = useToast();
  const { data: promotion, isLoading: loadingPromotion } = useFetchPromotion(promotionId || "");
  const { mutate: savePromotion, isPending: saving } = useSavePromotion();
  const { data: products, isLoading: loadingProducts } = useFetchProducts();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { user } = useAuth();
  
  // State for bundle products selection and product search
  const [selectedBundleProducts, setSelectedBundleProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]); // New state for multi-product selection
  const [searchQuery, setSearchQuery] = useState('');
  const [multiProductSearchQuery, setMultiProductSearchQuery] = useState(''); // New state for multi-product search
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [secondaryProductSearchQuery, setSecondaryProductSearchQuery] = useState('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [secondaryProductSearchOpen, setSecondaryProductSearchOpen] = useState(false);
  const [multiProductSearchOpen, setMultiProductSearchOpen] = useState(false); // New state for multi-product search open

  // Initialize the form
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'discount_percentage',
      discountPercent: 10,
      discountValue: undefined,
      fixedPrice: undefined,
      buyQuantity: undefined,
      getQuantity: undefined,
      secondaryProductId: undefined,
      secondaryProductDiscount: 100, // Default to 100% (free)
      bundlePrice: undefined,
      productId: undefined,
      categoryId: undefined,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: true,
      bundleProducts: [],
      productIds: [], // Add default value for productIds
    },
  });

  // Watch the promotion type to conditionally render fields
  const promotionType = form.watch('type');
  
  // Get selected product details
  const selectedProductId = form.watch('productId');
  const selectedProduct = selectedProductId 
    ? products?.find(p => p.id === selectedProductId) 
    : null;

  // Get selected secondary product details for buy_x_get_y
  const selectedSecondaryProductId = form.watch('secondaryProductId');
  const selectedSecondaryProduct = selectedSecondaryProductId
    ? products?.find(p => p.id === selectedSecondaryProductId)
    : null;

  // Get selected category details
  const selectedCategoryId = form.watch('categoryId');
  const selectedCategory = selectedCategoryId
    ? categories?.find(c => c.id === selectedCategoryId)
    : null;

  // Populate form when editing an existing promotion
  useEffect(() => {
    if (promotion && promotionId) {
      // Set bundle products if applicable
      if (promotion.bundleProducts) {
        setSelectedBundleProducts(promotion.bundleProducts);
      }
      
      // Set selected products if applicable
      if (promotion.productIds) {
        setSelectedProducts(promotion.productIds);
      }
      
      form.reset({
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        discountPercent: promotion.discountPercent,
        discountValue: promotion.discountValue,
        fixedPrice: promotion.fixedPrice,
        buyQuantity: promotion.buyQuantity,
        getQuantity: promotion.getQuantity,
        secondaryProductId: promotion.secondaryProductId,
        secondaryProductDiscount: promotion.secondaryProductDiscount ?? 100,
        bundlePrice: promotion.bundlePrice,
        productId: promotion.productId,
        productIds: promotion.productIds || [],
        categoryId: promotion.categoryId,
        startDate: new Date(promotion.startDate),
        endDate: new Date(promotion.endDate),
        isActive: promotion.isActive,
        bundleProducts: promotion.bundleProducts,
      });
    }
  }, [promotion, promotionId, form]);

  const onSubmit = (data: PromotionFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para criar uma promoção',
      });
      return;
    }
    
    // Prepare bundle products
    const bundleProducts = data.type === 'bundle' 
      ? selectedBundleProducts 
      : undefined;
    
    // Construct promotion object
    const promotionToSave: Promotion = {
      id: promotionId || crypto.randomUUID(),
      name: data.name,
      type: data.type,
      description: data.description,
      discountPercent: data.type === 'discount_percentage' ? data.discountPercent : undefined,
      discountValue: data.type === 'discount_value' ? data.discountValue : undefined,
      fixedPrice: data.type === 'fixed_price' ? data.fixedPrice : undefined,
      buyQuantity: data.type === 'buy_x_get_y' ? data.buyQuantity : undefined,
      getQuantity: data.type === 'buy_x_get_y' ? data.getQuantity : undefined,
      secondaryProductId: data.type === 'buy_x_get_y' ? data.secondaryProductId : undefined,
      secondaryProductDiscount: data.type === 'buy_x_get_y' ? data.secondaryProductDiscount : undefined,
      bundlePrice: data.type === 'bundle' ? data.bundlePrice : undefined,
      bundleProducts: bundleProducts,
      productId: ['buy_x_get_y', 'fixed_price'].includes(data.type) || 
        (['discount_percentage', 'discount_value'].includes(data.type) && data.productId && !selectedProducts.length) 
        ? data.productId 
        : undefined,
      productIds: ['discount_percentage', 'discount_value'].includes(data.type) && selectedProducts.length > 0
        ? selectedProducts
        : undefined,
      categoryId: ['discount_percentage', 'discount_value'].includes(data.type) && data.categoryId 
        ? data.categoryId 
        : undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      createdBy: user.id,
      createdAt: promotion?.createdAt || new Date(),
    };
    
    savePromotion(promotionToSave, {
      onSuccess: () => {
        toast({
          title: promotionId ? 'Promoção atualizada' : 'Promoção criada',
          description: promotionId 
            ? 'A promoção foi atualizada com sucesso' 
            : 'A promoção foi criada com sucesso',
        });
        onSubmitted();
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Ocorreu um erro ao salvar a promoção',
        });
      }
    });
  };

  // Handle adding a product to the multi-product selection
  const handleSelectMultiProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      const updatedProducts = [...selectedProducts, productId];
      setSelectedProducts(updatedProducts);
      form.setValue('productIds', updatedProducts);
      
      // Clear single product selection
      form.setValue('productId', undefined);
    }
    setMultiProductSearchQuery('');
  };

  // Handle removing a product from the multi-product selection
  const handleRemoveMultiProduct = (productId: string) => {
    const updatedProducts = selectedProducts.filter(id => id !== productId);
    setSelectedProducts(updatedProducts);
    form.setValue('productIds', updatedProducts);
  };

  // Handle adding a product to the bundle
  const handleSelectBundleProduct = (productId: string) => {
    if (!selectedBundleProducts.includes(productId)) {
      const updatedProducts = [...selectedBundleProducts, productId];
      setSelectedBundleProducts(updatedProducts);
      form.setValue('bundleProducts', updatedProducts);
    }
    setSearchQuery('');
  };

  // Handle removing a product from the bundle
  const handleRemoveBundleProduct = (productId: string) => {
    const updatedProducts = selectedBundleProducts.filter(id => id !== productId);
    setSelectedBundleProducts(updatedProducts);
    form.setValue('bundleProducts', updatedProducts);
  };

  // Filter products based on search query for bundle
  const filteredProducts = products?.filter(product => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  // Filter products based on multi-product search query
  const filteredMultiProducts = products?.filter(product => {
    if (!multiProductSearchQuery) return true;
    
    const query = multiProductSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  // Filter products based on product search query for buy_x_get_y
  const filteredProductsForSearch = products?.filter(product => {
    if (!productSearchQuery) return true;
    
    const query = productSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  // Filter products based on secondary product search query for buy_x_get_y
  const filteredSecondaryProductsForSearch = products?.filter(product => {
    if (!secondaryProductSearchQuery) return true;
    
    const query = secondaryProductSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  // Handle selecting a product from the search
  const handleSelectProduct = (productId: string) => {
    form.setValue('productId', productId);
    setProductSearchOpen(false);
    setProductSearchQuery('');
  };

  // Handle selecting a secondary product from the search
  const handleSelectSecondaryProduct = (productId: string) => {
    form.setValue('secondaryProductId', productId);
    setSecondaryProductSearchOpen(false);
    setSecondaryProductSearchQuery('');
  };

  // Get total bundle value (original prices)
  const getBundleTotalValue = () => {
    if (!selectedBundleProducts.length || !products) return 0;
    
    return selectedBundleProducts.reduce((total, productId) => {
      const product = products.find(p => p.id === productId);
      return total + (product?.salePrice || 0);
    }, 0);
  };

  // Get bundle discount percentage
  const getBundleDiscountPercentage = () => {
    const totalValue = getBundleTotalValue();
    const bundlePrice = form.watch('bundlePrice') || 0;
    
    if (totalValue <= 0 || bundlePrice <= 0) return 0;
    
    const discountPercentage = 100 - ((bundlePrice / totalValue) * 100);
    return Math.round(discountPercentage * 100) / 100; // Round to 2 decimal places
  };

  if ((promotionId && loadingPromotion) || loadingProducts || loadingCategories) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="conditions">Condições da Promoção</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Promoção</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Promoção de Verão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Promoção</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value: PromotionType) => {
                        field.onChange(value);
                        
                        // Reset relevant fields when promotion type changes
                        if (value === 'discount_percentage') {
                          form.setValue('discountPercent', 10);
                          form.setValue('discountValue', undefined);
                          form.setValue('fixedPrice', undefined);
                          form.setValue('buyQuantity', undefined);
                          form.setValue('getQuantity', undefined);
                          form.setValue('bundlePrice', undefined);
                          form.setValue('secondaryProductId', undefined);
                          form.setValue('secondaryProductDiscount', undefined);
                        } else if (value === 'discount_value') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', 10);
                          form.setValue('fixedPrice', undefined);
                          form.setValue('buyQuantity', undefined);
                          form.setValue('getQuantity', undefined);
                          form.setValue('bundlePrice', undefined);
                          form.setValue('secondaryProductId', undefined);
                          form.setValue('secondaryProductDiscount', undefined);
                        } else if (value === 'fixed_price') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', undefined);
                          form.setValue('fixedPrice', 29.90);
                          form.setValue('buyQuantity', undefined);
                          form.setValue('getQuantity', undefined);
                          form.setValue('bundlePrice', undefined);
                          form.setValue('categoryId', undefined);
                          form.setValue('secondaryProductId', undefined);
                          form.setValue('secondaryProductDiscount', undefined);
                        } else if (value === 'buy_x_get_y') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', undefined);
                          form.setValue('fixedPrice', undefined);
                          form.setValue('buyQuantity', 2);
                          form.setValue('getQuantity', 1);
                          form.setValue('bundlePrice', undefined);
                          form.setValue('categoryId', undefined);
                          form.setValue('secondaryProductDiscount', 100);
                        } else if (value === 'bundle') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', undefined);
                          form.setValue('fixedPrice', undefined);
                          form.setValue('buyQuantity', undefined);
                          form.setValue('getQuantity', undefined);
                          form.setValue('bundlePrice', 99.90);
                          form.setValue('productId', undefined);
                          form.setValue('categoryId', undefined);
                          form.setValue('secondaryProductId', undefined);
                          form.setValue('secondaryProductDiscount', undefined);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de promoção" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="discount_percentage">Desconto Percentual</SelectItem>
                        <SelectItem value="discount_value">Desconto em Valor</SelectItem>
                        <SelectItem value="buy_x_get_y">Compre X Leve Y</SelectItem>
                        <SelectItem value="fixed_price">Preço Fixo</SelectItem>
                        <SelectItem value="bundle">Pacote de Produtos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O tipo de promoção determina como o desconto será aplicado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhes da promoção" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="conditions" className="space-y-6 py-4">
            {promotionType === 'discount_percentage' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="discountPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Percentual de Desconto (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Aplicar em:</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produto Específico</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  form.setValue('categoryId', undefined);
                                  // Clear multiple products selection when single product is selected
                                  setSelectedProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('categoryId') || selectedProducts.length > 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  form.setValue('productId', undefined);
                                  // Clear multiple products selection when category is selected
                                  setSelectedProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('productId') || selectedProducts.length > 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  
                    {/* New section for multiple products selection */}
                    <div className="space-y-2 mt-4">
                      <FormLabel>Ou Selecione Múltiplos Produtos</FormLabel>
                      <div className="space-y-4">
                        <div className="relative">
                          <Popover open={multiProductSearchOpen} onOpenChange={setMultiProductSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={multiProductSearchOpen}
                                className="w-full justify-between"
                                disabled={!!form.watch('productId') || !!form.watch('categoryId')}
                              >
                                {selectedProducts.length > 0 
                                  ? `${selectedProducts.length} produtos selecionados` 
                                  : "Buscar produtos..."}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar por nome ou código" 
                                  value={multiProductSearchQuery}
                                  onValueChange={setMultiProductSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                                  <CommandGroup>
                                    {filteredMultiProducts?.map(product => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.id}
                                        onSelect={() => handleSelectMultiProduct(product.id)}
                                      >
                                        <div className="flex flex-col">
                                          <span>{product.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            Código: {product.code} | {formatCurrency(product.salePrice)}
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Display selected products */}
                        {selectedProducts.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Produtos selecionados:</div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {selectedProducts.map((productId) => {
                                const product = products?.find(p => p.id === productId);
                                if (!product) return null;
                                
                                return (
                                  <div key={product.id} className="flex items-center justify-between border p-2 rounded-md">
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatCurrency(product.salePrice)}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMultiProduct(product.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  
                    {!form.watch('productId') && !form.watch('categoryId') && selectedProducts.length === 0 && (
                      <p className="text-sm text-destructive">
                        Selecione um produto, múltiplos produtos ou uma categoria.
                      </p>
                    )}
                  </div>
                </div>
              
                {selectedProduct && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Prévia do Desconto</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div>Desconto ({form.watch('discountPercent')}%):</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency((selectedProduct.salePrice * (form.watch('discountPercent') || 0)) / 100)}
                        </div>
                        <div>Preço Final:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(selectedProduct.salePrice - ((selectedProduct.salePrice * (form.watch('discountPercent') || 0)) / 100))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedProducts.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Prévia do Desconto para Múltiplos Produtos</h4>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {selectedProducts.map(productId => {
                          const product = products?.find(p => p.id === productId);
                          if (!product) return null;
                          
                          const discountAmount = (product.salePrice * (form.watch('discountPercent') || 0)) / 100;
                          const finalPrice = product.salePrice - discountAmount;
                          
                          return (
                            <div key={product.id} className="border-b pb-2">
                              <div className="font-medium">{product.name}</div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Preço Original:</div>
                                <div>{formatCurrency(product.salePrice)}</div>
                                <div>Desconto ({form.watch('discountPercent')}%):</div>
                                <div className="text-destructive">-{formatCurrency(discountAmount)}</div>
                                <div>Preço Final:</div>
                                <div className="text-green-600">{formatCurrency(finalPrice)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedCategory && (
                  <div className="text-sm">
                    Aplicando desconto de {form.watch('discountPercent')}% em todos os produtos da categoria <strong>{selectedCategory.name}</strong>.
                  </div>
                )}
              </div>
            )}
            
            {promotionType === 'discount_value' && (
              <div className="space-y-6">
                {/* Content for discount_value type */}
                {/* (Similar to discount_percentage with appropriate fields) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor do Desconto (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0.01" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Aplicar em:</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produto Específico</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  form.setValue('categoryId', undefined);
                                  // Clear multiple products selection when single product is selected
                                  setSelectedProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('categoryId') || selectedProducts.length > 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um produto" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  form.setValue('productId', undefined);
                                  // Clear multiple products selection when category is selected
                                  setSelectedProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('productId') || selectedProducts.length > 0}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
