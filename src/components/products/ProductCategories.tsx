import React, { useState } from 'react';
import { useSaveProduct, useCategories } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Edit, Trash, RefreshCw, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductCategoriesProps {
  fullWidth?: boolean;
}

export const ProductCategories = ({ fullWidth = false }: ProductCategoriesProps) => {
  const { data: categories, isLoading } = useCategories();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const { mutate: saveCategory } = useSaveProduct();
  const { toast } = useToast();

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "Nome da categoria é obrigatório.",
      });
      return;
    }

    // Here, we're using the regular mutate function since mutateAsync is not available
    saveCategory(
      {
        id: `temp-${Date.now()}`,
        name: newCategoryName.trim(),
        description: '',
        code: '',
        category: { id: '', name: '' },
        salePrice: 0,
        costPrice: 0,
        stock: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        onSuccess: () => {
          toast({
            title: "Categoria adicionada",
            description: `A categoria ${newCategoryName} foi adicionada com sucesso.`
          });
          setNewCategoryName('');
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível adicionar a categoria."
          });
        }
      }
    );
  };

  const handleEditCategory = () => {
    if (!editCategoryName.trim() || !editCategoryId) {
      return;
    }

    // Here we use the regular mutate function
    saveCategory(
      {
        id: editCategoryId,
        name: editCategoryName.trim(),
        description: '',
        code: '',
        category: { id: '', name: '' },
        salePrice: 0,
        costPrice: 0,
        stock: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        onSuccess: () => {
          toast({
            title: "Categoria atualizada",
            description: `A categoria foi atualizada com sucesso.`
          });
          setEditCategoryId(null);
          setEditCategoryName('');
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível atualizar a categoria."
          });
        }
      }
    );
  };

  const startEdit = (id: string, name: string) => {
    setEditCategoryId(id);
    setEditCategoryName(name);
  };

  const cancelEdit = () => {
    setEditCategoryId(null);
    setEditCategoryName('');
  };

  return (
    <Card className={fullWidth ? 'w-full' : 'w-[400px]'}>
      <CardHeader>
        <CardTitle>Categorias de Produtos</CardTitle>
        <CardDescription>
          Gerencie as categorias de produtos da sua loja.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          ) : categories?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            categories?.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between space-x-2"
              >
                {editCategoryId === category.id ? (
                  <div className="flex items-center space-x-2 w-full">
                    <Input
                      type="text"
                      value={editCategoryName}
                      onChange={(e) => setEditCategoryName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleEditCategory}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={cancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium">{category.name}</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => startEdit(category.id, category.name)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center space-x-2 w-full">
          <Input
            type="text"
            placeholder="Nova categoria"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
