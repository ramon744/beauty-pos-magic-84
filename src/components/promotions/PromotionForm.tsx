
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
import { X, Calendar as CalendarIcon, Search, ShoppingBag, Gift, Percent, Tag } from 'lucide-react';
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
  
  if (['discount_percentage', 'discount_value'].includes(data.type) && !data.productId && !data.categoryId) {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [secondaryProductSearchQuery, setSecondaryProductSearchQuery] = useState('');
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [secondaryProductSearchOpen, setSecondaryProductSearchOpen] = useState(false);

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
                                }
                              }}
                              disabled={!!form.watch('categoryId')}
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
                                }
                              }}
                              disabled={!!form.watch('productId')}
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
                    
                    {!form.watch('productId') && !form.watch('categoryId') && (
                      <p className="text-sm text-destructive">
                        Selecione um produto ou uma categoria.
                      </p>
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
                                }
                              }}
                              disabled={!!form.watch('categoryId')}
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
                                }
                              }}
                              disabled={!!form.watch('productId')}
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
                    
                    {!form.watch('productId') && !form.watch('categoryId') && (
                      <p className="text-sm text-destructive">
                        Selecione um produto ou uma categoria.
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedProduct && (
                  <Card className="overflow-hidden border-2 border-blue-100 shadow-md">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-blue-800">Prévia do Desconto</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-600">Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div className="text-gray-600">Desconto:</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency(form.watch('discountValue') || 0)}
                        </div>
                        <div className="text-gray-600">Preço Final:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(Math.max(0, selectedProduct.salePrice - (form.watch('discountValue') || 0)))}
                        </div>
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
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
                </div>
                
                {selectedProduct && (
                  <Card className="overflow-hidden border-2 border-amber-100 shadow-md">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-amber-800">Prévia do Preço Promocional</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-600">Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div className="text-gray-600">Preço Promocional:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(form.watch('fixedPrice') || 0)}
                        </div>
                        <div className="text-gray-600">Economia:</div>
                        <div className="font-semibold text-destructive">
                          {selectedProduct.salePrice > (form.watch('fixedPrice') || 0) ? 
                            `-${formatCurrency(selectedProduct.salePrice - (form.watch('fixedPrice') || 0))}` : 
                            'Sem economia'}
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
                  <div className="space-y-4">
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
                            {selectedProduct ? selectedProduct.name : "Buscar produto..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar por nome ou código" 
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
                    {!selectedProduct && (
                      <p className="text-sm text-destructive">
                        Selecione um produto para a promoção
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <FormLabel>Produto Secundário (Opcional)</FormLabel>
                    <div className="relative">
                      <Popover open={secondaryProductSearchOpen} onOpenChange={setSecondaryProductSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={secondaryProductSearchOpen}
                            className="w-full justify-between"
                          >
                            {selectedSecondaryProduct ? selectedSecondaryProduct.name : "Mesmo produto ou buscar outro..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar por nome ou código" 
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
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="buyQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compre Quantidade</FormLabel>
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
                        <FormLabel>Leve Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secondaryProductDiscount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto no Produto (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="100" step="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          100% = Grátis
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {selectedProduct && (
                  <Card className="overflow-hidden border-2 border-purple-100 shadow-md">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-purple-800">Prévia da Promoção</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-full bg-purple-100">
                            <ShoppingBag className="h-4 w-4 text-purple-600" />
                          </div>
                          <p className="font-medium">Comprando {form.watch('buyQuantity')} unidades de <span className="text-purple-700 font-semibold">{selectedProduct.name}</span></p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-full bg-pink-100">
                            <Gift className="h-4 w-4 text-pink-600" />
                          </div>
                          {selectedSecondaryProduct ? (
                            <p>
                              O cliente leva {form.watch('getQuantity')} unidades de <span className="text-pink-700 font-semibold">{selectedSecondaryProduct.name}</span> com <span className="font-semibold">{form.watch('secondaryProductDiscount')}%</span> de desconto.
                            </p>
                          ) : (
                            <p>
                              O cliente leva {form.watch('getQuantity')} unidades adicionais do mesmo produto com <span className="font-semibold">{form.watch('secondaryProductDiscount')}%</span> de desconto.
                            </p>
                          )}
                        </div>
                        
                        {form.watch('secondaryProductDiscount') === 100 && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded-md text-center">
                            <p className="font-medium text-green-600">
                              Produto com 100% de desconto = GRÁTIS!
                            </p>
                          </div>
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
                    <div className="mb-2">
                      <FormLabel className="block mb-2">Produtos no Pacote</FormLabel>
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Buscar por nome ou código..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2 space-y-2">
                      {selectedBundleProducts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedBundleProducts.map(productId => {
                            const product = products?.find(p => p.id === productId);
                            return product ? (
                              <Badge 
                                key={product.id} 
                                variant="secondary"
                                className="px-2 py-1 flex items-center gap-1"
                              >
                                {product.name} ({formatCurrency(product.salePrice)})
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 w-5 p-0" 
                                  onClick={() => handleRemoveBundleProduct(product.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">
                          Adicione pelo menos dois produtos ao pacote
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {searchQuery && (
                  <Card className="mt-2">
                    <CardContent className="p-2">
                      <div className="max-h-[200px] overflow-y-auto">
                        {filteredProducts && filteredProducts.length > 0 ? (
                          <div className="space-y-1">
                            {filteredProducts.map(product => (
                              <Button
                                key={product.id}
                                variant="ghost"
                                className="w-full justify-start text-left"
                                onClick={() => handleSelectBundleProduct(product.id)}
                                disabled={selectedBundleProducts.includes(product.id)}
                              >
                                <div className="flex flex-col items-start">
                                  <span>{product.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    Código: {product.code} | {formatCurrency(product.salePrice)}
                                  </span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground p-2">
                            Nenhum produto encontrado
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {selectedBundleProducts.length > 0 && (
                  <Card className="overflow-hidden border-2 border-indigo-100 shadow-md">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2 border-b">
                      <h4 className="font-medium text-indigo-800">Resumo do Pacote</h4>
                    </div>
                    <CardContent className="p-4 bg-white">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-600">Valor Total dos Produtos:</div>
                        <div className="font-semibold">{formatCurrency(getBundleTotalValue())}</div>
                        <div className="text-gray-600">Preço do Pacote:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(form.watch('bundlePrice') || 0)}
                        </div>
                        <div className="text-gray-600">Economia:</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency(getBundleTotalValue() - (form.watch('bundlePrice') || 0))}
                        </div>
                        <div className="text-gray-600">Desconto Percentual:</div>
                        <div className="font-semibold">
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                            {getBundleDiscountPercentage()}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormLabel>Período da Promoção</FormLabel>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Inicial</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
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
                              onSelect={field.onChange}
                              initialFocus
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
                        <FormLabel>Data Final</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
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
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                          A promoção será aplicada automaticamente aos produtos compatíveis
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
                      <FormLabel>Desconto Máximo por Compra (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          placeholder="Sem limite" 
                          {...field}
                          value={field.value || ''}
                          onChange={e => {
                            const value = e.target.value ? parseFloat(e.target.value) : undefined;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Opcional. Deixe em branco para não aplicar limite.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="pt-6">
              <Button type="submit" className="w-full md:w-auto" disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {promotionId ? 'Atualizando...' : 'Criando...'}
                  </>
                ) : (
                  promotionId ? 'Atualizar Promoção' : 'Criar Promoção'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
