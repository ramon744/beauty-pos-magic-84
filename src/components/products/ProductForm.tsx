
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
import { Search, X, CalendarIcon } from 'lucide-react';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Define the form schema
const productFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().optional(),
  code: z.string().min(1, { message: 'Código é obrigatório' }),
  categoryId: z.string().min(1, { message: 'Categoria é obrigatória' }),
  salePrice: z.coerce.number().positive({ message: 'Preço de venda deve ser maior que zero' }),
  costPrice: z.coerce.number().positive({ message: 'Preço de custo deve ser maior que zero' }),
  stock: z.coerce.number().int().nonnegative({ message: 'Estoque não pode ser negativo' }),
  image: z.string().optional(),
  supplierIds: z.array(z.string()).optional(),
  expirationDate: z.date().optional(), // Added expiration date field
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
  
  // State for selected suppliers
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize the form
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
      image: '',
      supplierIds: [],
      expirationDate: undefined,
    },
  });

  // Populate form when editing an existing product
  useEffect(() => {
    if (product && productId) {
      // Find all suppliers that are linked to this product
      const productSuppliers = product.supplierIds 
        ? suppliers?.filter(s => product.supplierIds?.includes(s.id)) || []
        : [];
      
      setSelectedSuppliers(productSuppliers);
      
      form.reset({
        name: product.name,
        description: product.description,
        code: product.code,
        categoryId: product.category.id,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        stock: product.stock,
        image: product.image,
        supplierIds: product.supplierIds || [],
        expirationDate: product.expirationDate,
      });
    }
  }, [product, productId, form, suppliers]);

  const onSubmit = (data: ProductFormValues) => {
    // Get all selected suppliers
    const productSuppliers = selectedSuppliers.length > 0 ? selectedSuppliers : undefined;
    const supplierIds = selectedSuppliers.map(s => s.id);
    
    // Ensure all required fields are present
    const productToSave: Product = {
      id: productId || crypto.randomUUID(),
      name: data.name,
      description: data.description || '',
      code: data.code,
      category: categories?.find(c => c.id === data.categoryId) || { id: data.categoryId, name: 'Unknown' },
      salePrice: data.salePrice,
      costPrice: data.costPrice,
      stock: data.stock,
      image: data.image,
      supplierIds: supplierIds.length > 0 ? supplierIds : undefined,
      suppliers: productSuppliers,
      expirationDate: data.expirationDate, // Added expiration date
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
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
      onError: () => {
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

  // Handle adding a supplier to the selected list
  const handleSelectSupplier = (supplier: Supplier) => {
    // Check if supplier is already selected to avoid duplicates
    if (!selectedSuppliers.some(s => s.id === supplier.id)) {
      const updatedSuppliers = [...selectedSuppliers, supplier];
      setSelectedSuppliers(updatedSuppliers);
      form.setValue('supplierIds', updatedSuppliers.map(s => s.id));
    }
    // Clear search after selection
    setSearchQuery('');
  };

  // Handle removing a supplier from the selected list
  const handleRemoveSupplier = (supplierId: string) => {
    const updatedSuppliers = selectedSuppliers.filter(s => s.id !== supplierId);
    setSelectedSuppliers(updatedSuppliers);
    form.setValue('supplierIds', updatedSuppliers.map(s => s.id));
  };

  // Filter suppliers based on search query (name, cnpj)
  const filteredSuppliers = suppliers?.filter(supplier => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(query) ||
      supplier.cnpj.toLowerCase().includes(query)
    );
  });

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
                    <FormControl>
                      <Input placeholder="Digite o código do produto" {...field} />
                    </FormControl>
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
          </TabsContent>
          
          {/* New tab for dates */}
          <TabsContent value="dates" className="space-y-6 py-4">
            <Card>
              <CardContent className="p-6">
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Validade</FormLabel>
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
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        {/* Supplier search */}
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

                        {/* Selected suppliers */}
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
    </Form>
  );
}
