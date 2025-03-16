
import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useFetchProduct, useCategories, useSaveProduct } from '@/hooks/use-products';
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
import { Product } from '@/types';

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
    },
  });

  // Populate form when editing an existing product
  useEffect(() => {
    if (product && productId) {
      form.reset({
        name: product.name,
        description: product.description,
        code: product.code,
        categoryId: product.category.id,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        stock: product.stock,
        image: product.image,
      });
    }
  }, [product, productId, form]);

  const onSubmit = (data: ProductFormValues) => {
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

  if ((productId && loadingProduct) || loadingCategories) {
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
            <TabsTrigger value="pricing">Preços e Estoque</TabsTrigger>
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
