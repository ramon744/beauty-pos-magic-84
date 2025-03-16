import React, { useState } from 'react';
import { useCategories } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, X, Edit, Trash } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Category, Product } from '@/types';
import { storageService } from '@/services/storage-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Storage key for categories
const CATEGORIES_STORAGE_KEY = 'categories';
const PRODUCTS_STORAGE_KEY = 'products';

export function ProductCategories() {
  const { toast } = useToast();
  const { data: categories, isLoading, refetch } = useCategories();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State for category deletion dialog
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedTargetCategory, setSelectedTargetCategory] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleInitiateDelete = (category: Category) => {
    // Get current products
    const products = storageService.getItem<Product[]>(PRODUCTS_STORAGE_KEY) || [];
    
    // Check if any products use this category
    const productsWithCategory = products.filter(product => product.category.id === category.id);
    
    if (productsWithCategory.length > 0) {
      // Open dialog to select a new category
      setCategoryToDelete(category);
      setSelectedTargetCategory('');
      setShowDeleteDialog(true);
    } else {
      // No products with this category, proceed with deletion
      handleConfirmDelete(category);
    }
  };

  const handleConfirmDelete = (category: Category, targetCategoryId?: string) => {
    try {
      // Get current categories and products
      const currentCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
      const products = storageService.getItem<Product[]>(PRODUCTS_STORAGE_KEY) || [];
      
      // Filter out the deleted category
      const updatedCategories = currentCategories.filter(cat => cat.id !== category.id);
      
      // Update products if target category is provided
      if (targetCategoryId) {
        const targetCategory = currentCategories.find(cat => cat.id === targetCategoryId);
        
        if (targetCategory) {
          const updatedProducts = products.map(product => {
            if (product.category.id === category.id) {
              return {
                ...product,
                category: targetCategory,
                updatedAt: new Date()
              };
            }
            return product;
          });
          
          // Save updated products
          storageService.setItem(PRODUCTS_STORAGE_KEY, updatedProducts);
          
          toast({
            title: "Produtos migrados",
            description: `Os produtos foram migrados para a categoria "${targetCategory.name}".`,
          });
        }
      }
      
      // Save updated categories
      storageService.setItem(CATEGORIES_STORAGE_KEY, updatedCategories);
      
      // Update product statistics
      updateProductStatistics();
      
      toast({
        title: "Categoria excluída",
        description: `A categoria "${category.name}" foi excluída com sucesso.`,
      });
      
      // Refresh data
      refetch();
      
      // Reset state
      setCategoryToDelete(null);
      setSelectedTargetCategory('');
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a categoria. Tente novamente.",
      });
    }
  };
  
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
  
  const availableCategoriesForMigration = categories?.filter(
    category => category.id !== categoryToDelete?.id
  ) || [];

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
                    <span className="truncate max-w-[70%]">{category.name}</span>
                    <div className="flex shrink-0 space-x-1">
                      <Button
                        onClick={() => setEditingCategory(category)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleInitiateDelete(category)}
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
        
        <Dialog open={showDeleteDialog} onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setCategoryToDelete(null);
            setSelectedTargetCategory('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Migrar produtos antes de excluir</DialogTitle>
              <DialogDescription>
                A categoria "{categoryToDelete?.name}" possui produtos associados a ela. 
                Selecione outra categoria para migrar esses produtos antes de excluir.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select
                value={selectedTargetCategory}
                onValueChange={setSelectedTargetCategory}
                disabled={availableCategoriesForMigration.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategoriesForMigration.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {availableCategoriesForMigration.length === 0 && (
                <p className="text-sm text-destructive mt-2">
                  Não há outras categorias disponíveis. Crie uma nova categoria primeiro.
                </p>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (categoryToDelete && selectedTargetCategory) {
                    handleConfirmDelete(categoryToDelete, selectedTargetCategory);
                  }
                }}
                disabled={!selectedTargetCategory || availableCategoriesForMigration.length === 0}
                variant="default"
              >
                Migrar e Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
