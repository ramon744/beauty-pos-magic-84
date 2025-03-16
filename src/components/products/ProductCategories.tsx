
import React, { useState } from 'react';
import { useCategories } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, X, Edit, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types';

export function ProductCategories() {
  const { toast } = useToast();
  const { data: categories, isLoading, refetch } = useCategories();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    // In a real app, we would call an API to add the category
    toast({
      title: "Categoria adicionada",
      description: `A categoria "${newCategory}" foi adicionada com sucesso.`,
    });
    
    setNewCategory('');
    setShowAddForm(false);
    refetch();
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    // In a real app, we would call an API to update the category
    toast({
      title: "Categoria atualizada",
      description: `A categoria foi atualizada com sucesso.`,
    });
    
    setEditingCategory(null);
    refetch();
  };

  const handleDeleteCategory = (category: Category) => {
    // In a real app, we would call an API to delete the category
    toast({
      title: "Categoria excluída",
      description: `A categoria "${category.name}" foi excluída com sucesso.`,
    });
    
    refetch();
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">Categorias</CardTitle>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="flex items-center space-x-2 mb-4">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nova categoria"
              className="h-8"
            />
            <Button
              onClick={handleAddCategory}
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!newCategory.trim()}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShowAddForm(false)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded-md"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {categories?.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                {editingCategory?.id === category.id ? (
                  <div className="flex flex-1 items-center space-x-2">
                    <Input
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      }
                      className="h-7 text-sm"
                    />
                    <Button
                      onClick={handleUpdateCategory}
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={!editingCategory.name.trim()}
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => setEditingCategory(null)}
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span>{category.name}</span>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => setEditingCategory(category)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCategory(category)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {categories?.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                Nenhuma categoria encontrada
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
