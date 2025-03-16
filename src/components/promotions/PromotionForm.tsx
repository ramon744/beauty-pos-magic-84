
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
  bundlePrice: z.coerce.number().optional(),
  productId: z.string().optional(),
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
  if (['discount_percentage', 'discount_value'].includes(data.type) && !data.productId && !data.categoryId) {
    return false;
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
  
  // State for bundle products selection
  const [selectedBundleProducts, setSelectedBundleProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
      bundlePrice: undefined,
      productId: undefined,
      categoryId: undefined,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: true,
      bundleProducts: [],
    },
  });

  // Watch the promotion type to conditionally render fields
  const promotionType = form.watch('type');
  
  // Get selected product details
  const selectedProductId = form.watch('productId');
  const selectedProduct = selectedProductId 
    ? products?.find(p => p.id === selectedProductId) 
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
      
      form.reset({
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        discountPercent: promotion.discountPercent,
        discountValue: promotion.discountValue,
        fixedPrice: promotion.fixedPrice,
        buyQuantity: promotion.buyQuantity,
        getQuantity: promotion.getQuantity,
        bundlePrice: promotion.bundlePrice,
        productId: promotion.productId,
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

  // Filter products based on search query
  const filteredProducts = products?.filter(product => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.code.toLowerCase().includes(query)
    );
  });

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
                        } else if (value === 'discount_value') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', 10);
                          form.setValue('fixedPrice', undefined);
                          form.setValue('buyQuantity', undefined);
                          form.setValue('getQuantity', undefined);
                          form.setValue('bundlePrice', undefined);
                        } else if (value === 'fixed_price') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', undefined);
                          form.setValue('fixedPrice', 29.90);
                          form.setValue('buyQuantity', undefined);
                          form.setValue('getQuantity', undefined);
                          form.setValue('bundlePrice', undefined);
                          form.setValue('categoryId', undefined);
                        } else if (value === 'buy_x_get_y') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', undefined);
                          form.setValue('fixedPrice', undefined);
                          form.setValue('buyQuantity', 2);
                          form.setValue('getQuantity', 1);
                          form.setValue('bundlePrice', undefined);
                          form.setValue('categoryId', undefined);
                        } else if (value === 'bundle') {
                          form.setValue('discountPercent', undefined);
                          form.setValue('discountValue', undefined);
                          form.setValue('fixedPrice', undefined);
                          form.setValue('buyQuantity', undefined);
                          form.setValue('getQuantity', undefined);
                          form.setValue('bundlePrice', 99.90);
                          form.setValue('productId', undefined);
                          form.setValue('categoryId', undefined);
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
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Prévia do Desconto</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div>Desconto:</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency(form.watch('discountValue') || 0)}
                        </div>
                        <div>Preço Final:</div>
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
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Prévia do Preço Promocional</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Preço Original:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div>Preço Promocional:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(form.watch('fixedPrice') || 0)}
                        </div>
                        <div>Economia:</div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  
                  <FormField
                    control={form.control}
                    name="buyQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantos Comprar</FormLabel>
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
                        <FormLabel>Quantos Levar de Brinde</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {selectedProduct && form.watch('buyQuantity') && form.watch('getQuantity') && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Prévia da Promoção</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Produto:</div>
                        <div className="font-semibold">{selectedProduct.name}</div>
                        <div>Preço Unitário:</div>
                        <div className="font-semibold">{formatCurrency(selectedProduct.salePrice)}</div>
                        <div>Compra:</div>
                        <div className="font-semibold">
                          {form.watch('buyQuantity')} unidades ({formatCurrency((form.watch('buyQuantity') || 0) * selectedProduct.salePrice)})
                        </div>
                        <div>Leva:</div>
                        <div className="font-semibold text-green-600">
                          {(form.watch('buyQuantity') || 0) + (form.watch('getQuantity') || 0)} unidades
                        </div>
                        <div>Economia:</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency((form.watch('getQuantity') || 0) * selectedProduct.salePrice)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {promotionType === 'bundle' && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="bundleProducts"
                  render={() => (
                    <FormItem>
                      <FormLabel>Produtos do Pacote</FormLabel>
                      <div className="space-y-4">
                        {/* Product search */}
                        <div className="relative">
                          <Command className="rounded-lg border shadow-md">
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <CommandInput 
                                placeholder="Buscar produtos..." 
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                              />
                            </div>
                            <CommandList>
                              <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                              <CommandGroup heading="Produtos">
                                {filteredProducts?.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.id}
                                    onSelect={() => handleSelectBundleProduct(product.id)}
                                    className="flex justify-between"
                                  >
                                    <div>
                                      <span className="font-medium">{product.name}</span>
                                      <p className="text-xs text-muted-foreground">
                                        Código: {product.code} | {formatCurrency(product.salePrice)}
                                      </p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectBundleProduct(product.id);
                                      }}
                                    >
                                      Adicionar
                                    </Button>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </div>

                        {/* Selected products */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Produtos selecionados:</div>
                          {selectedBundleProducts.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic">
                              Nenhum produto selecionado
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedBundleProducts.map((productId) => {
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
                                      onClick={() => handleRemoveBundleProduct(product.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                
                {selectedBundleProducts.length >= 2 && form.watch('bundlePrice') && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Prévia do Pacote</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Produtos Incluídos:</div>
                        <div className="font-semibold">{selectedBundleProducts.length} itens</div>
                        <div>Valor Total Original:</div>
                        <div className="font-semibold">{formatCurrency(getBundleTotalValue())}</div>
                        <div>Preço do Pacote:</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(form.watch('bundlePrice') || 0)}
                        </div>
                        <div>Economia:</div>
                        <div className="font-semibold text-destructive">
                          -{formatCurrency(getBundleTotalValue() - (form.watch('bundlePrice') || 0))} ({getBundleDiscountPercentage()}%)
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
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Selecione uma data</span>
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
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                    <FormLabel>Data de Término</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Selecione uma data</span>
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
                          disabled={(date) => {
                            const startDate = form.watch('startDate');
                            return startDate && date < startDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Promoção Ativa</FormLabel>
                    <FormDescription>
                      Ative ou desative esta promoção sem excluí-la do sistema.
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
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onSubmitted}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : promotionId ? 'Atualizar Promoção' : 'Criar Promoção'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
