
import React, { useState } from 'react';
import { useCategories } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, X, Edit, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Category } from '@/types';
import { storageService } from '@/services/storage-service';

// Storage key for categories
const CATEGORIES_STORAGE_KEY = 'categories';

export function ProductCategories() {
  const { toast } = useToast();
  const { data: categories, isLoading, refetch } = useCategories();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    try {
      // Get current categories
      const currentCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
      
      // Create new category with unique ID
      const newCategoryObj: Category = {
        id: crypto.randomUUID(),
        name: newCategory.trim()
      };
      
      // Add to storage
      storageService.setItem(CATEGORIES_STORAGE_KEY, [...currentCategories, newCategoryObj]);
      
      toast({
        title: "Categoria adicionada",
        description: `A categoria "${newCategory}" foi adicionada com sucesso.`,
      });
      
      // Reset form
      setNewCategory('');
      setShowAddForm(false);
      
      // Refresh data
      refetch();
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar a categoria. Tente novamente.",
      });
    }
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    try {
      // Get current categories
      const currentCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
      
      // Find and update the category
      const updatedCategories = currentCategories.map(cat => 
        cat.id === editingCategory.id ? { ...cat, name: editingCategory.name.trim() } : cat
      );
      
      // Save to storage
      storageService.setItem(CATEGORIES_STORAGE_KEY, updatedCategories);
      
      toast({
        title: "Categoria atualizada",
        description: `A categoria foi atualizada com sucesso.`,
      });
      
      // Reset editing state
      setEditingCategory(null);
      
      // Refresh data
      refetch();
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
      });
    }
  };

  const handleDeleteCategory = (category: Category) => {
    try {
      // Get current categories
      const currentCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
      
      // Filter out the deleted category
      const updatedCategories = currentCategories.filter(cat => cat.id !== category.id);
      
      // Save to storage
      storageService.setItem(CATEGORIES_STORAGE_KEY, updatedCategories);
      
      // Also need to update product statistics
      updateProductStatistics();
      
      toast({
        title: "Categoria excluída",
        description: `A categoria "${category.name}" foi excluída com sucesso.`,
      });
      
      // Refresh data
      refetch();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a categoria. Tente novamente.",
      });
    }
  };
  
  // Helper function to update product statistics after operations
  const updateProductStatistics = () => {
    // Get the products and categories
    const products = storageService.getItem<any[]>('products') || [];
    const categories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
    
    // Calculate statistics
    const statistics = {
      totalProducts: products.length,
      stockValue: products.reduce((total, product) => total + (product.costPrice * product.stock), 0),
      outOfStock: products.filter(product => product.stock === 0).length,
      categories: categories.length,
    };
    
    // Update statistics in storage
    storageService.setItem('products-statistics', statistics);
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
