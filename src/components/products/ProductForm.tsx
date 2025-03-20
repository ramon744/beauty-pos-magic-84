
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useFetchProduct, useCategories, useSaveProduct } from '@/hooks/use-products';
import { useFetchSuppliers } from '@/hooks/use-suppliers';
import {
  Form,
  FormControl,
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ImageUpload } from '@/components/products/ImageUpload';
import { Product, Supplier } from '@/types';
import { Search, X, CalendarIcon, AlertCircle, ScanBarcode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBarcodeScan } from '@/hooks/use-barcode-scan';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const productFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  code: z.string().min(1, { message: 'Código é obrigatório' }),
  categoryId: z.string().min(1, { message: 'Categoria é obrigatória' }),
  salePrice: z.coerce.number().positive({ message: 'Preço de venda deve ser maior que zero' }),
  costPrice: z.coerce.number().positive({ message: 'Preço de custo deve ser maior que zero' }),
  stock: z.coerce.number().int().nonnegative({ message: 'Estoque não pode ser negativo' }),
  minimumStock: z.coerce.number().int().nonnegative({ message: 'Estoque mínimo não pode ser negativo' }).optional(),
  image: z.string().optional(),
  supplierIds: z.array(z.string()).optional(),
  expirationDate: z.date().optional().nullable(),
  expirationDateInput: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  productId: string | null;
  onSubmitted: () => void;
}

export default function ProductForm({ productId, onSubmitted }: ProductFormProps) {
  const { toast } = useToast();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: product, isLoading: loadingProduct } = useFetchProduct(productId || "");
  const { mutate: saveProduct, isPending: saving } = useSaveProduct();
  const { data: suppliers, isLoading: loadingSuppliers } = useFetchSuppliers();
  
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateInputMode, setDateInputMode] = useState<'calendar' | 'manual'>('calendar');
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      code: '',
      categoryId: '',
      salePrice: 0,
      costPrice: 0,
      stock: 0,
      minimumStock: 0,
      image: '',
      supplierIds: [],
      expirationDate: null,
      expirationDateInput: '',
    },
  });

  const handleBarcodeDetected = (barcode: string) => {
    form.setValue('code', barcode);
    setIsBarcodeDialogOpen(false);
    toast({
      title: 'Código de barras detectado',
      description: `O código ${barcode} foi adicionado ao produto`,
    });
  };

  const { startScanning, stopScanning, isScanning } = useBarcodeScan(handleBarcodeDetected);

  const openBarcodeScanner = () => {
    setIsBarcodeDialogOpen(true);
    startScanning();
  };

  const closeBarcodeScanner = () => {
    setIsBarcodeDialogOpen(false);
    stopScanning();
  };

  useEffect(() => {
    if (product && productId) {
      console.log("Loading product data for edit:", product);
      
      // Make sure product has all required properties before setting form values
      const safeProduct = {
        ...product,
        category: product.category || { id: '', name: 'Sem categoria' },
        salePrice: typeof product.salePrice === 'number' ? product.salePrice : Number(product.salePrice) || 0,
        costPrice: typeof product.costPrice === 'number' ? product.costPrice : Number(product.costPrice) || 0,
        stock: typeof product.stock === 'number' ? product.stock : Number(product.stock) || 0,
        minimumStock: typeof product.minimumStock === 'number' ? product.minimumStock : Number(product.minimumStock) || 0,
      };
      
      const productSuppliers = safeProduct.supplierIds 
        ? suppliers?.filter(s => safeProduct.supplierIds?.includes(s.id)) || []
        : [];
      
      setSelectedSuppliers(productSuppliers);
      
      form.reset({
        name: safeProduct.name,
        description: safeProduct.description || '',
        code: safeProduct.code || '',
        categoryId: safeProduct.category?.id || '',
        salePrice: safeProduct.salePrice,
        costPrice: safeProduct.costPrice,
        stock: safeProduct.stock,
        minimumStock: safeProduct.minimumStock || 0,
        image: safeProduct.image || '',
        supplierIds: safeProduct.supplierIds || [],
        expirationDate: safeProduct.expirationDate ? new Date(safeProduct.expirationDate) : null,
        expirationDateInput: safeProduct.expirationDate ? format(new Date(safeProduct.expirationDate), 'dd/MM/yyyy') : '',
      });
    }
  }, [product, productId, form, suppliers]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const handleDateInput = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    
    let formattedValue = '';
    if (digitsOnly.length > 0) {
      formattedValue = digitsOnly.substring(0, Math.min(2, digitsOnly.length));
      
      if (digitsOnly.length > 2) {
        formattedValue += '/' + digitsOnly.substring(2, Math.min(4, digitsOnly.length));
      }
      
      if (digitsOnly.length > 4) {
        formattedValue += '/' + digitsOnly.substring(4, Math.min(8, digitsOnly.length));
      }
    }
    
    form.setValue('expirationDateInput', formattedValue);
    
    if (formattedValue.length === 10) {
      try {
        const parsedDate = parse(formattedValue, 'dd/MM/yyyy', new Date());
        
        if (isValid(parsedDate)) {
          form.setValue('expirationDate', parsedDate);
        }
      } catch (error) {
        console.error("Error parsing date:", error);
      }
    } else {
      form.setValue('expirationDate', null);
    }
  };

  const handleCalendarDateChange = (date: Date | undefined) => {
    form.setValue('expirationDate', date || null);
    if (date) {
      form.setValue('expirationDateInput', format(date, 'dd/MM/yyyy'));
    } else {
      form.setValue('expirationDateInput', '');
    }
  };

  const onSubmit = (data: ProductFormValues) => {
    console.log("Form submission data:", data);
    const productSuppliers = selectedSuppliers.length > 0 ? selectedSuppliers : undefined;
    const supplierIds = selectedSuppliers.map(s => s.id);
    
    const productToSave: Product = {
      id: productId || crypto.randomUUID(),
      name: data.name,
      description: data.description || '',
      code: data.code,
      category: categories?.find(c => c.id === data.categoryId) || { id: data.categoryId, name: 'Unknown' },
      salePrice: data.salePrice,
      costPrice: data.costPrice,
      stock: data.stock,
      minimumStock: data.minimumStock,
      image: data.image,
      supplierIds: supplierIds.length > 0 ? supplierIds : undefined,
      suppliers: productSuppliers,
      expirationDate: data.expirationDate,
      createdAt: product?.createdAt ? new Date(product.createdAt) : new Date(),
      updatedAt: new Date(),
    };
    
    console.log("Saving product:", productToSave);
    
    saveProduct(productToSave, {
      onSuccess: () => {
        toast({
          title: productId ? 'Produto atualizado' : 'Produto criado',
          description: productId 
            ? 'O produto foi atualizado com sucesso' 
            : 'O produto foi criado com sucesso',
        });
        onSubmitted();
      },
      onError: (error) => {
        console.error("Error saving product:", error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Ocorreu um erro ao salvar o produto',
        });
      }
    });
  };

  const handleImageUpload = (imageUrl: string) => {
    form.setValue('image', imageUrl);
  };

  const handleSelectSupplier = (supplier: Supplier) => {
    if (!selectedSuppliers.some(s => s.id === supplier.id)) {
      const updatedSuppliers = [...selectedSuppliers, supplier];
      setSelectedSuppliers(updatedSuppliers);
      form.setValue('supplierIds', updatedSuppliers.map(s => s.id));
    }
    setSearchQuery('');
  };

  const handleRemoveSupplier = (supplierId: string) => {
    const updatedSuppliers = selectedSuppliers.filter(s => s.id !== supplierId);
    setSelectedSuppliers(updatedSuppliers);
    form.setValue('supplierIds', updatedSuppliers.map(s => s.id));
  };

  const filteredSuppliers = suppliers?.filter(supplier => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(query) ||
      supplier.cnpj.toLowerCase().includes(query)
    );
  });

  const isMinimumStockValid = () => {
    const stock = form.watch('stock');
    const minStock = form.watch('minimumStock');
    
    return minStock !== undefined && minStock > 0 && minStock < stock;
  };

  if ((productId && loadingProduct) || loadingCategories || loadingSuppliers) {
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Informações Gerais</TabsTrigger>
            <TabsTrigger value="pricing">Preços e Estoque</TabsTrigger>
            <TabsTrigger value="dates">Datas</TabsTrigger>
            <TabsTrigger value="supplier">Fornecedores</TabsTrigger>
            <TabsTrigger value="media">Imagens</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Digite ou escaneie o código do produto" {...field} />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={openBarcodeScanner}
                        className="flex-shrink-0"
                      >
                        <ScanBarcode className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingCategories}
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
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite a descrição do produto" 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="minimumStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Estoque Mínimo
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('minimumStock') > 0 && (
                <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    O sistema irá alertar quando o estoque estiver próximo ou abaixo de {form.watch('minimumStock')} unidades.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="dates" className="space-y-6 py-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <FormLabel className="text-base">Data de Validade</FormLabel>
                    <div className="flex space-x-2 mt-2">
                      <Button 
                        type="button" 
                        variant={dateInputMode === 'calendar' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setDateInputMode('calendar')}
                      >
                        Calendário
                      </Button>
                      <Button 
                        type="button" 
                        variant={dateInputMode === 'manual' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setDateInputMode('manual')}
                      >
                        Digitação Manual
                      </Button>
                    </div>
                  </div>
                  
                  {dateInputMode === 'calendar' ? (
                    <FormField
                      control={form.control}
                      name="expirationDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
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
                                    format(field.value, "dd/MM/yyyy")
                                  ) : (
                                    <span>Selecione a data de validade</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => handleCalendarDateChange(date)}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="expirationDateInput"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="DD/MM/AAAA"
                              value={field.value}
                              onChange={(e) => handleDateInput(e.target.value)}
                              maxLength={10}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-sm text-muted-foreground">Digite a data no formato DD/MM/AAAA</p>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="supplier" className="space-y-6 py-4">
            <Card>
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="supplierIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Fornecedores</FormLabel>
                      <div className="space-y-4">
                        <div className="relative">
                          <Command className="rounded-lg border shadow-md">
                            <div className="flex items-center border-b px-3">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <CommandInput 
                                placeholder="Buscar por nome ou CNPJ..." 
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                              />
                            </div>
                            <CommandList>
                              <CommandEmpty>Nenhum fornecedor encontrado</CommandEmpty>
                              <CommandGroup heading="Fornecedores">
                                {filteredSuppliers?.map((supplier) => (
                                  <CommandItem
                                    key={supplier.id}
                                    value={supplier.id}
                                    onSelect={() => handleSelectSupplier(supplier)}
                                    className="flex justify-between"
                                  >
                                    <div>
                                      <span className="font-medium">{supplier.name}</span>
                                      <p className="text-xs text-muted-foreground">CNPJ: {supplier.cnpj}</p>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectSupplier(supplier);
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

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Fornecedores selecionados:</div>
                          {selectedSuppliers.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic">
                              Nenhum fornecedor selecionado
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {selectedSuppliers.map((supplier) => (
                                <Badge key={supplier.id} variant="secondary" className="flex items-center gap-1">
                                  {supplier.name}
                                  <button
                                    type="button"
                                    className="ml-1 rounded-full p-1 hover:bg-background"
                                    onClick={() => handleRemoveSupplier(supplier.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="media" className="space-y-6 py-4">
            <Card>
              <CardContent className="p-6">
                <ImageUpload 
                  existingImage={form.watch('image')} 
                  onImageUploaded={handleImageUpload} 
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onSubmitted}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : productId ? 'Atualizar Produto' : 'Criar Produto'}
          </Button>
        </div>
      </form>

      <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Escanear Código de Barras</DialogTitle>
            <DialogDescription>
              {isScanning ? 'Escaneie o código de barras do produto com um leitor.' : 'Inicie o escaneamento.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-8">
            <ScanBarcode className="h-24 w-24 text-muted-foreground animate-pulse" />
            <p className="mt-4 text-center text-sm">
              {isScanning 
                ? "Aguardando leitura... Aponte o leitor para o código de barras." 
                : "Clique em Iniciar para ativar o leitor de código de barras."}
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={closeBarcodeScanner}>
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={isScanning ? stopScanning : startScanning}
            >
              {isScanning ? 'Parar' : 'Iniciar'} Leitura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
