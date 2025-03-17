
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
import { X, Calendar as CalendarIcon, Search, ShoppingBag, Gift, Percent, Tag, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

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
  productIds: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  bundleProducts: z.array(z.string()).optional(),
  maxDiscountPerPurchase: z.coerce.number().optional(),
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
  
  if (['discount_percentage', 'discount_value'].includes(data.type) && 
      !data.productId && !data.categoryId && (!data.productIds || data.productIds.length === 0)) {
    return false;
  }
  
  if (['buy_x_get_y', 'fixed_price'].includes(data.type) && !data.productId) {
    return false;
  }
  
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
  
  const [selectedBundleProducts, setSelectedBundleProducts] = useState<string[]>([]);
  const [selectedMultipleProducts, setSelectedMultipleProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [multipleProductSearchQuery, setMultipleProductSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [secondaryProductSearchQuery, setSecondaryProductSearchQuery] = useState('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [secondaryProductSearchOpen, setSecondaryProductSearchOpen] = useState(false);
  const [multipleProductSearchOpen, setMultipleProductSearchOpen] = useState(false);

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
      secondaryProductDiscount: 100,
      bundlePrice: undefined,
      productId: undefined,
      productIds: [],
      categoryId: undefined,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: true,
      bundleProducts: [],
      maxDiscountPerPurchase: undefined,
    },
  });

  const promotionType = form.watch('type');
  
  const selectedProductId = form.watch('productId');
  const selectedProduct = selectedProductId 
    ? products?.find(p => p.id === selectedProductId) 
    : null;

  const selectedSecondaryProductId = form.watch('secondaryProductId');
  const selectedSecondaryProduct = selectedSecondaryProductId
    ? products?.find(p => p.id === selectedSecondaryProductId)
    : null;

  const selectedCategoryId = form.watch('categoryId');
  const selectedCategory = selectedCategoryId
    ? categories?.find(c => c.id === selectedCategoryId)
    : null;

  useEffect(() => {
    if (promotion && promotionId) {
      if (promotion.bundleProducts) {
        setSelectedBundleProducts(promotion.bundleProducts);
      }
      
      if (promotion.productIds) {
        setSelectedMultipleProducts(promotion.productIds);
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
        maxDiscountPerPurchase: promotion.maxDiscountPerPurchase,
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
    
    const bundleProducts = data.type === 'bundle' 
      ? selectedBundleProducts 
      : undefined;
    
    const productIds = ['discount_percentage', 'discount_value'].includes(data.type) 
      ? selectedMultipleProducts.length > 0 ? selectedMultipleProducts : undefined
      : undefined;
    
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
        (['discount_percentage', 'discount_value'].includes(data.type) && data.productId) 
        ? data.productId 
        : undefined,
      productIds: productIds,
      categoryId: ['discount_percentage', 'discount_value'].includes(data.type) && data.categoryId 
        ? data.categoryId 
        : undefined,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive,
      createdBy: user.id,
      createdAt: promotion?.createdAt || new Date(),
      maxDiscountPerPurchase: data.maxDiscountPerPurchase,
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

  const handleSelectBundleProduct = (productId: string) => {
    if (!selectedBundleProducts.includes(productId)) {
      const updatedProducts = [...selectedBundleProducts, productId];
      setSelectedBundleProducts(updatedProducts);
      form.setValue('bundleProducts', updatedProducts);
    }
    setSearchQuery('');
  };

  const handleRemoveBundleProduct = (productId: string) => {
    const updatedProducts = selectedBundleProducts.filter(id => id !== productId);
    setSelectedBundleProducts(updatedProducts);
    form.setValue('bundleProducts', updatedProducts);
  };

  const handleSelectMultipleProduct = (productId: string) => {
    if (!selectedMultipleProducts.includes(productId)) {
      const updatedProducts = [...selectedMultipleProducts, productId];
      setSelectedMultipleProducts(updatedProducts);
      form.setValue('productIds', updatedProducts);
    }
    setMultipleProductSearchQuery('');
    setMultipleProductSearchOpen(false);
  };

  const handleRemoveMultipleProduct = (productId: string) => {
    const updatedProducts = selectedMultipleProducts.filter(id => id !== productId);
    setSelectedMultipleProducts(updatedProducts);
    form.setValue('productIds', updatedProducts);
  };

  const filteredProducts = products?.filter(product => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  const filteredProductsForSearch = products?.filter(product => {
    if (!productSearchQuery) return true;
    
    const query = productSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  const filteredMultipleProductsForSearch = products?.filter(product => {
    if (!multipleProductSearchQuery) return true;
    
    const query = multipleProductSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  const filteredSecondaryProductsForSearch = products?.filter(product => {
    if (!secondaryProductSearchQuery) return true;
    
    const query = secondaryProductSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

  const handleSelectProduct = (productId: string) => {
    form.setValue('productId', productId);
    setProductSearchOpen(false);
    setProductSearchQuery('');
  };

  const handleSelectSecondaryProduct = (productId: string) => {
    form.setValue('secondaryProductId', productId);
    setSecondaryProductSearchOpen(false);
    setSecondaryProductSearchQuery('');
  };

  const getBundleTotalValue = () => {
    if (!selectedBundleProducts.length || !products) return 0;
    
    return selectedBundleProducts.reduce((total, productId) => {
      const product = products.find(p => p.id === productId);
      return total + (product?.salePrice || 0);
    }, 0);
  };

  const getBundleDiscountPercentage = () => {
    const totalValue = getBundleTotalValue();
    const bundlePrice = form.watch('bundlePrice') || 0;
    
    if (totalValue <= 0 || bundlePrice <= 0) return 0;
    
    const discountPercentage = 100 - ((bundlePrice / totalValue) * 100);
    return Math.round(discountPercentage * 100) / 100;
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
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produto Único</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  form.setValue('categoryId', undefined);
                                  setSelectedMultipleProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('categoryId') || selectedMultipleProducts.length > 0}
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
                                  setSelectedMultipleProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('productId') || selectedMultipleProducts.length > 0}
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
                      
                      <div>
                        <FormLabel>Múltiplos Produtos</FormLabel>
                        <div className="relative mt-2">
                          <Popover open={multipleProductSearchOpen} onOpenChange={setMultipleProductSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={multipleProductSearchOpen}
                                className="w-full justify-between"
                                disabled={!!form.watch('productId') || !!form.watch('categoryId')}
                              >
                                <span className="truncate">
                                  {selectedMultipleProducts.length > 0 
                                    ? `${selectedMultipleProducts.length} produtos` 
                                    : "Selecionar produtos"}
                                </span>
                                <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar produtos..." 
                                  value={multipleProductSearchQuery}
                                  onValueChange={setMultipleProductSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                                  <CommandGroup>
                                    {filteredMultipleProductsForSearch?.map(product => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.id}
                                        onSelect={() => handleSelectMultipleProduct(product.id)}
                                        disabled={selectedMultipleProducts.includes(product.id)}
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
                      </div>
                    </div>
                    
                    {!form.watch('productId') && !form.watch('categoryId') && selectedMultipleProducts.length === 0 && (
                      <p className="text-sm text-destructive">
                        Selecione um produto, vários produtos ou uma categoria.
                      </p>
                    )}
                    
                    {selectedMultipleProducts.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Produtos selecionados:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMultipleProducts.map(productId => {
                            const product = products?.find(p => p.id === productId);
                            return product ? (
                              <Badge 
                                key={product.id} 
                                variant="secondary"
                                className="px-2 py-1 flex items-center gap-1"
                              >
                                {product.name}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0" 
                                  onClick={() => handleRemoveMultipleProduct(product.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedProduct && (
                  <Card className="overflow-hidden border-2 border-green-100 shadow-md">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-green-800">Prévia do Desconto</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-600">Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div className="text-gray-600">Desconto ({form.watch('discountPercent')}%):</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency((selectedProduct.salePrice * (form.watch('discountPercent') || 0)) / 100)}
                        </div>
                        <div className="text-gray-600">Preço Final:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(selectedProduct.salePrice - ((selectedProduct.salePrice * (form.watch('discountPercent') || 0)) / 100))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedMultipleProducts.length > 0 && (
                  <Card className="overflow-hidden border-2 border-green-100 shadow-md">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-green-800">Prévia do Desconto para Múltiplos Produtos</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <p className="text-sm mb-3">
                        Aplicando desconto de {form.watch('discountPercent')}% em {selectedMultipleProducts.length} produtos selecionados.
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedMultipleProducts.map(productId => {
                          const product = products?.find(p => p.id === productId);
                          if (!product) return null;
                          
                          const discount = (product.salePrice * (form.watch('discountPercent') || 0)) / 100;
                          const finalPrice = product.salePrice - discount;
                          
                          return (
                            <div key={product.id} className="grid grid-cols-4 gap-2 text-sm p-2 border-b">
                              <div className="font-medium">{product.name}</div>
                              <div>{formatCurrency(product.salePrice)}</div>
                              <div className="text-destructive">-{formatCurrency(discount)}</div>
                              <div className="text-green-600">{formatCurrency(finalPrice)}</div>
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
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Produto Único</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                if (value) {
                                  form.setValue('categoryId', undefined);
                                  setSelectedMultipleProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('categoryId') || selectedMultipleProducts.length > 0}
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
                                  setSelectedMultipleProducts([]);
                                  form.setValue('productIds', []);
                                }
                              }}
                              disabled={!!form.watch('productId') || selectedMultipleProducts.length > 0}
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
                      
                      <div>
                        <FormLabel>Múltiplos Produtos</FormLabel>
                        <div className="relative mt-2">
                          <Popover open={multipleProductSearchOpen} onOpenChange={setMultipleProductSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={multipleProductSearchOpen}
                                className="w-full justify-between"
                                disabled={!!form.watch('productId') || !!form.watch('categoryId')}
                              >
                                <span className="truncate">
                                  {selectedMultipleProducts.length > 0 
                                    ? `${selectedMultipleProducts.length} produtos` 
                                    : "Selecionar produtos"}
                                </span>
                                <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar produtos..." 
                                  value={multipleProductSearchQuery}
                                  onValueChange={setMultipleProductSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                                  <CommandGroup>
                                    {filteredMultipleProductsForSearch?.map(product => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.id}
                                        onSelect={() => handleSelectMultipleProduct(product.id)}
                                        disabled={selectedMultipleProducts.includes(product.id)}
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
                      </div>
                    </div>
                    
                    {!form.watch('productId') && !form.watch('categoryId') && selectedMultipleProducts.length === 0 && (
                      <p className="text-sm text-destructive">
                        Selecione um produto, vários produtos ou uma categoria.
                      </p>
                    )}
                    
                    {selectedMultipleProducts.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-2">Produtos selecionados:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMultipleProducts.map(productId => {
                            const product = products?.find(p => p.id === productId);
                            return product ? (
                              <Badge 
                                key={product.id} 
                                variant="secondary"
                                className="px-2 py-1 flex items-center gap-1"
                              >
                                {product.name}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0" 
                                  onClick={() => handleRemoveMultipleProduct(product.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedProduct && (
                  <Card className="overflow-hidden border-2 border-green-100 shadow-md">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-green-800">Prévia do Desconto</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-600">Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div className="text-gray-600">Desconto:</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency(Math.min(form.watch('discountValue') || 0, selectedProduct.salePrice))}
                        </div>
                        <div className="text-gray-600">Preço Final:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(Math.max(selectedProduct.salePrice - (form.watch('discountValue') || 0), 0))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedMultipleProducts.length > 0 && (
                  <Card className="overflow-hidden border-2 border-green-100 shadow-md">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-green-800">Prévia do Desconto para Múltiplos Produtos</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <p className="text-sm mb-3">
                        Aplicando desconto de {formatCurrency(form.watch('discountValue') || 0)} em {selectedMultipleProducts.length} produtos selecionados.
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {selectedMultipleProducts.map(productId => {
                          const product = products?.find(p => p.id === productId);
                          if (!product) return null;
                          
                          // Calculate proportional discount based on product price
                          const totalValue = selectedMultipleProducts.reduce((total, id) => {
                            const p = products?.find(prod => prod.id === id);
                            return total + (p?.salePrice || 0);
                          }, 0);
                          
                          const proportion = product.salePrice / totalValue;
                          const discount = Math.min(
                            product.salePrice, 
                            (form.watch('discountValue') || 0) * proportion
                          );
                          const finalPrice = product.salePrice - discount;
                          
                          return (
                            <div key={product.id} className="grid grid-cols-4 gap-2 text-sm p-2 border-b">
                              <div className="font-medium">{product.name}</div>
                              <div>{formatCurrency(product.salePrice)}</div>
                              <div className="text-destructive">-{formatCurrency(discount)}</div>
                              <div className="text-green-600">{formatCurrency(finalPrice)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedCategory && (
                  <div className="text-sm">
                    Aplicando desconto de {formatCurrency(form.watch('discountValue') || 0)} em todos os produtos da categoria <strong>{selectedCategory.name}</strong>.
                  </div>
                )}
              </div>
            )}
            
            {promotionType === 'fixed_price' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="fixedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Fixo (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0.01" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto</FormLabel>
                        <div className="relative">
                          <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={productSearchOpen}
                                className="w-full justify-between"
                              >
                                {field.value && products ? (
                                  <span className="truncate">
                                    {products.find(p => p.id === field.value)?.name || "Selecione um produto"}
                                  </span>
                                ) : (
                                  <span>Selecione um produto</span>
                                )}
                                <ShoppingBag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar produtos..." 
                                  value={productSearchQuery}
                                  onValueChange={setProductSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                                  <CommandGroup>
                                    {filteredProductsForSearch?.map(product => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.id}
                                        onSelect={() => handleSelectProduct(product.id)}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {selectedProduct && (
                  <Card className="overflow-hidden border-2 border-green-100 shadow-md">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-green-800">Prévia da Promoção</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-600">Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div className="text-gray-600">Novo Preço:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(form.watch('fixedPrice') || 0)}
                        </div>
                        <div className="text-gray-600">Economia:</div>
                        <div className="font-semibold text-destructive">
                          {selectedProduct.salePrice > (form.watch('fixedPrice') || 0) ? (
                            `-${formatCurrency(selectedProduct.salePrice - (form.watch('fixedPrice') || 0))}`
                          ) : (
                            'Sem desconto'
                          )}
                        </div>
                        <div className="text-gray-600">Desconto:</div>
                        <div className="font-semibold">
                          {selectedProduct.salePrice > (form.watch('fixedPrice') || 0) ? (
                            `${Math.round((1 - ((form.watch('fixedPrice') || 0) / selectedProduct.salePrice)) * 100)}%`
                          ) : (
                            '0%'
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {promotionType === 'buy_x_get_y' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="buyQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compre (quantidade)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="getQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Leve (quantidade)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" step="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto Principal</FormLabel>
                        <div className="relative">
                          <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={productSearchOpen}
                                className="w-full justify-between"
                              >
                                {field.value && products ? (
                                  <span className="truncate">
                                    {products.find(p => p.id === field.value)?.name || "Selecione um produto"}
                                  </span>
                                ) : (
                                  <span>Selecione um produto</span>
                                )}
                                <ShoppingBag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar produtos..." 
                                  value={productSearchQuery}
                                  onValueChange={setProductSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                                  <CommandGroup>
                                    {filteredProductsForSearch?.map(product => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.id}
                                        onSelect={() => handleSelectProduct(product.id)}
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
                        <FormDescription>Produto que o cliente precisa comprar</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="secondaryProductId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto Secundário (opcional)</FormLabel>
                        <div className="relative">
                          <Popover open={secondaryProductSearchOpen} onOpenChange={setSecondaryProductSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={secondaryProductSearchOpen}
                                className="w-full justify-between"
                              >
                                {field.value && products ? (
                                  <span className="truncate">
                                    {products.find(p => p.id === field.value)?.name || "Mesmo produto"}
                                  </span>
                                ) : (
                                  <span>Mesmo produto</span>
                                )}
                                <Gift className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                              <Command>
                                <CommandInput 
                                  placeholder="Buscar produtos..." 
                                  value={secondaryProductSearchQuery}
                                  onValueChange={setSecondaryProductSearchQuery}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                                  <CommandGroup>
                                    {filteredSecondaryProductsForSearch?.map(product => (
                                      <CommandItem
                                        key={product.id}
                                        value={product.id}
                                        onSelect={() => handleSelectSecondaryProduct(product.id)}
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
                        <FormDescription>
                          Produto que o cliente vai ganhar desconto. Se não selecionado, será o mesmo produto.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secondaryProductDiscount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto no Produto Secundário (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" step="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          100% = Grátis, 50% = Metade do preço, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {selectedProduct && (
                  <Card className="overflow-hidden border-2 border-green-100 shadow-md">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-green-800">Prévia da Promoção</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <p className="font-medium text-lg mb-4">
                        Compre {form.watch('buyQuantity') || 0} {selectedProduct.name}, 
                        Leve {form.watch('getQuantity') || 0}
                        {selectedSecondaryProduct && selectedSecondaryProduct.id !== selectedProduct.id
                          ? ` ${selectedSecondaryProduct.name}` : ''}
                        {' '}com {form.watch('secondaryProductDiscount')}% de desconto
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-600">Produto Principal:</div>
                        <div className="font-semibold">{selectedProduct.name}</div>
                        
                        <div className="text-gray-600">Preço Unitário:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        
                        {selectedSecondaryProduct && selectedSecondaryProduct.id !== selectedProduct.id ? (
                          <>
                            <div className="text-gray-600">Produto Secundário:</div>
                            <div className="font-semibold">{selectedSecondaryProduct.name}</div>
                            
                            <div className="text-gray-600">Preço do Secundário:</div>
                            <div className="font-semibold">{formatCurrency(selectedSecondaryProduct.salePrice)}</div>
                            
                            <div className="text-gray-600">Desconto no Secundário:</div>
                            <div className="font-semibold text-destructive">
                              {form.watch('secondaryProductDiscount')}% = 
                              {formatCurrency((selectedSecondaryProduct.salePrice * (form.watch('secondaryProductDiscount') || 0)) / 100)}
                            </div>
                            
                            <div className="text-gray-600">Preço Final do Secundário:</div>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(selectedSecondaryProduct.salePrice - ((selectedSecondaryProduct.salePrice * (form.watch('secondaryProductDiscount') || 0)) / 100))}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-gray-600">Desconto no próprio produto:</div>
                            <div className="font-semibold text-destructive">
                              {form.watch('secondaryProductDiscount')}% = 
                              {formatCurrency((selectedProduct.salePrice * (form.watch('secondaryProductDiscount') || 0)) / 100)}
                            </div>
                            
                            <div className="text-gray-600">Preço após desconto:</div>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(selectedProduct.salePrice - ((selectedProduct.salePrice * (form.watch('secondaryProductDiscount') || 0)) / 100))}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {promotionType === 'bundle' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bundlePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço do Pacote (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0.01" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <label className="text-sm font-medium">Adicionar Produtos ao Pacote</label>
                    <div className="relative mt-2">
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          type="text"
                          placeholder="Pesquisar produtos para adicionar..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="mt-1"
                        />
                        
                        {searchQuery.length > 0 && (
                          <div className="absolute z-10 w-full bg-white shadow-lg rounded-md border border-gray-200 mt-1 max-h-60 overflow-y-auto">
                            {filteredProducts?.length === 0 ? (
                              <div className="p-2 text-sm text-gray-500">
                                Nenhum produto encontrado
                              </div>
                            ) : (
                              <div className="p-2">
                                {filteredProducts?.map(product => (
                                  <div 
                                    key={product.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer rounded-md flex justify-between items-center"
                                    onClick={() => handleSelectBundleProduct(product.id)}
                                  >
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-xs text-gray-500">
                                        Código: {product.code} | {formatCurrency(product.salePrice)}
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedBundleProducts.length > 0 ? (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Produtos no Pacote:</h3>
                    <div className="space-y-2">
                      {selectedBundleProducts.map(productId => {
                        const product = products?.find(p => p.id === productId);
                        return product ? (
                          <div 
                            key={product.id} 
                            className="flex justify-between items-center p-2 border rounded-md"
                          >
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(product.salePrice)}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveBundleProduct(product.id)}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null;
                      })}
                    </div>
                    
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Valor Total dos Produtos:</span>
                        <span className="font-semibold">{formatCurrency(getBundleTotalValue())}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Preço do Pacote:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(form.watch('bundlePrice') || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Desconto Total:</span>
                        <span className="font-semibold text-destructive">
                          {getBundleDiscountPercentage()}% 
                          ({formatCurrency(getBundleTotalValue() - (form.watch('bundlePrice') || 0))})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed rounded-md text-center text-gray-500">
                    Adicione produtos ao pacote para visualizar o desconto.
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Término</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(field.value)
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                            disabled={(date) => 
                              date < new Date(new Date().setHours(0, 0, 0, 0)) || 
                              date < form.watch('startDate')
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativar Promoção</FormLabel>
                        <FormDescription>
                          Quando ativada, a promoção será aplicada automaticamente nas vendas.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="maxDiscountPerPurchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Desconto por Compra (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          placeholder="Opcional" 
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? undefined : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Limite o valor máximo de desconto por compra. Deixe em branco para não ter limite.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSubmitted}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Salvando...
              </>
            ) : (
              <>{promotionId ? 'Atualizar Promoção' : 'Criar Promoção'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
