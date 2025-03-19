import React, { useState, useEffect } from 'react';
import { useCategories, useFetchProducts, useSaveProduct } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Save, X, Edit, Trash, Search, Clock, ArrowRight, Filter, RotateCcw, Calendar, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Category, Product } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from '@/lib/formatters';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fromTable, extractDataFromSupabase } from '@/services/supabase-helper';

interface ProductCategoriesProps {
  fullWidth?: boolean;
}

interface TempCategoryAssignment {
  productId: string;
  originalCategoryId: string;
  tempCategoryId: string;
  expireAt: Date;
}

const TEMP_CATEGORY_STORAGE_KEY = 'temp-category-assignments';
const PRODUCTS_STORAGE_KEY = STORAGE_KEYS.PRODUCTS;
const CATEGORIES_STORAGE_KEY = STORAGE_KEYS.CATEGORIES;

export function ProductCategories({ fullWidth = false }: ProductCategoriesProps) {
  const { toast } = useToast();
  const { data: categories, isLoading, refetch } = useCategories();
  const { data: products } = useFetchProducts();
  const { mutate: saveProduct } = useSaveProduct();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedTargetCategory, setSelectedTargetCategory] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('manage');
  
  const [showTempCategoryDialog, setShowTempCategoryDialog] = useState(false);
  const [selectedTempCategory, setSelectedTempCategory] = useState('');
  const [tempDuration, setTempDuration] = useState('custom');
  const [temporaryAssignments, setTemporaryAssignments] = useState<TempCategoryAssignment[]>([]);
  
  const [customDate, setCustomDate] = useState<Date>(new Date());
  const [customTimeHours, setCustomTimeHours] = useState('23');
  const [customTimeMinutes, setCustomTimeMinutes] = useState('59');
  
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    const storedAssignments = storageService.getItem<TempCategoryAssignment[]>(TEMP_CATEGORY_STORAGE_KEY) || [];
    setTemporaryAssignments(storedAssignments);
    
    checkExpiredAssignments();
    
    const interval = setInterval(checkExpiredAssignments, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = products?.filter(product => {
    const matchesSearch = 
      searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === '' || 
      product.category.id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const checkExpiredAssignments = async () => {
    const storedAssignments = storageService.getItem<TempCategoryAssignment[]>(TEMP_CATEGORY_STORAGE_KEY) || [];
    const now = new Date();
    const expiredAssignments = storedAssignments.filter(
      assignment => new Date(assignment.expireAt) <= now
    );
    
    if (expiredAssignments.length > 0) {
      for (const assignment of expiredAssignments) {
        await revertTemporaryAssignment(assignment);
      }
      
      const validAssignments = storedAssignments.filter(
        assignment => new Date(assignment.expireAt) > now
      );
      storageService.setItem(TEMP_CATEGORY_STORAGE_KEY, validAssignments);
      setTemporaryAssignments(validAssignments);
      
      toast({
        title: "Categorias temporárias atualizadas",
        description: `${expiredAssignments.length} produto(s) retornaram para suas categorias originais.`,
      });
      
      refetch();
    }
  };

  const revertTemporaryAssignment = async (assignment: TempCategoryAssignment) => {
    try {
      const allProducts = storageService.getItem<Product[]>(PRODUCTS_STORAGE_KEY) || [];
      const product = allProducts.find(p => p.id === assignment.productId);
      
      if (!product) {
        console.error(`Product not found: ${assignment.productId}`);
        return;
      }
      
      const allCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
      const originalCategory = allCategories.find(c => c.id === assignment.originalCategoryId);
      
      if (!originalCategory) {
        console.error(`Original category not found: ${assignment.originalCategoryId}`);
        return;
      }
      
      await saveProduct({
        ...product,
        category: originalCategory,
        updatedAt: new Date()
      }, {
        onSuccess: () => {},
        onError: () => {}
      });
      
      console.log(`Product ${product.name} reverted from ${product.category.name} to ${originalCategory.name}`);
    } catch (error) {
      console.error("Erro ao reverter categoria temporária:", error);
      throw error;
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const currentCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
      
      const newCategoryObj: Category = {
        id: crypto.randomUUID(),
        name: newCategory.trim()
      };
      
      await storageService.saveToSupabase('categories', newCategoryObj);
      
      toast({
        title: "Categoria adicionada",
        description: `A categoria "${newCategory}" foi adicionada com sucesso.`,
      });
      
      setNewCategory('');
      setShowAddForm(false);
      
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

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) return;
    
    try {
      await storageService.saveToSupabase('categories', {
        ...editingCategory,
        name: editingCategory.name.trim()
      });
      
      toast({
        title: "Categoria atualizada",
        description: `A categoria foi atualizada com sucesso.`,
      });
      
      setEditingCategory(null);
      
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
    const products = storageService.getItem<Product[]>(PRODUCTS_STORAGE_KEY) || [];
    
    const productsWithCategory = products.filter(product => product.category.id === category.id);
    
    if (productsWithCategory.length > 0) {
      setCategoryToDelete(category);
      setSelectedTargetCategory('');
      setShowDeleteDialog(true);
    } else {
      handleConfirmDelete(category);
    }
  };

  const handleConfirmDelete = async (category: Category, targetCategoryId?: string) => {
    try {
      const currentCategories = storageService.getItem<Category[]>(STORAGE_KEYS.CATEGORIES) || [];
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      
      const updatedCategories = currentCategories.filter(cat => cat.id !== category.id);
      
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
          
          for (const product of updatedProducts) {
            if (product.category.id === targetCategory.id) {
              await storageService.saveToSupabase(STORAGE_KEYS.PRODUCTS, product);
            }
          }
        }
      }
      
      await storageService.removeFromSupabase('categories', category.id);
      
      updateProductStatistics();
      
      toast({
        title: "Categoria excluída",
        description: `A categoria "${category.name}" foi excluída com sucesso.`,
      });
      
      refetch();
      
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
    const products = storageService.getItem<any[]>('products') || [];
    const categories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
    
    const statistics = {
      totalProducts: products.length,
      stockValue: products.reduce((total, product) => total + (product.costPrice * product.stock), 0),
      outOfStock: products.filter(product => product.stock === 0).length,
      categories: categories.length,
    };
    
    storageService.setItem('products-statistics', statistics);
  };

  const availableCategoriesForMigration = categories?.filter(
    category => category.id !== categoryToDelete?.id
  ) || [];

  const handleSelectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
  };

  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleMoveToCategory = async (categoryId: string) => {
    if (selectedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para mover.",
      });
      return;
    }
    
    try {
      const allProducts = storageService.getItem<Product[]>(PRODUCTS_STORAGE_KEY) || [];
      const allCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
      const targetCategory = allCategories.find(cat => cat.id === categoryId);
      
      if (!targetCategory) {
        throw new Error("Categoria não encontrada");
      }
      
      for (const productId of selectedProducts) {
        const product = allProducts.find(p => p.id === productId);
        if (product) {
          await saveProduct({
            ...product,
            category: targetCategory,
            updatedAt: new Date()
          }, {
            onSuccess: () => {},
            onError: () => {}
          });
        }
      }
      
      toast({
        title: "Produtos movidos",
        description: `${selectedProducts.length} produto(s) movidos para a categoria "${targetCategory.name}".`,
      });
      
      setSelectedProducts([]);
    } catch (error) {
      console.error("Erro ao mover produtos:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível mover os produtos. Tente novamente.",
      });
    }
  };

  const handleOpenTempCategoryDialog = () => {
    if (selectedProducts.length === 0) {
      toast({
        variant: "destructive",
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para mover temporariamente.",
      });
      return;
    }
    
    setSelectedTempCategory('');
    setTempDuration('custom');
    setShowTempCategoryDialog(true);
  };

  const calculateExpirationDate = (): Date => {
    if (tempDuration === 'custom') {
      const expirationDate = new Date(customDate);
      expirationDate.setHours(parseInt(customTimeHours));
      expirationDate.setMinutes(parseInt(customTimeMinutes));
      return expirationDate;
    } else {
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + parseInt(tempDuration));
      return expireAt;
    }
  };

  const handleAssignTempCategory = async () => {
    if (!selectedTempCategory || selectedProducts.length === 0) return;
    
    try {
      const allProducts = storageService.getItem<Product[]>(PRODUCTS_STORAGE_KEY) || [];
      const allCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
      const targetCategory = allCategories.find(cat => cat.id === selectedTempCategory);
      
      if (!targetCategory) {
        throw new Error("Categoria não encontrada");
      }
      
      const expireAt = calculateExpirationDate();
      
      const currentAssignments = storageService.getItem<TempCategoryAssignment[]>(TEMP_CATEGORY_STORAGE_KEY) || [];
      const newAssignments: TempCategoryAssignment[] = [];
      
      for (const productId of selectedProducts) {
        const product = allProducts.find(p => p.id === productId);
        if (product) {
          const assignment: TempCategoryAssignment = {
            productId: product.id,
            originalCategoryId: product.category.id,
            tempCategoryId: targetCategory.id,
            expireAt
          };
          
          newAssignments.push(assignment);
          
          await saveProduct({
            ...product,
            category: targetCategory,
            updatedAt: new Date()
          }, {
            onSuccess: () => {},
            onError: () => {}
          });
        }
      }
      
      const filteredAssignments = currentAssignments.filter(
        a => !selectedProducts.includes(a.productId)
      );
      
      const updatedAssignments = [...filteredAssignments, ...newAssignments];
      storageService.setItem(TEMP_CATEGORY_STORAGE_KEY, updatedAssignments);
      setTemporaryAssignments(updatedAssignments);
      
      const formattedDate = format(expireAt, "dd/MM/yyyy 'às' HH:mm");
      
      toast({
        title: "Categoria temporária atribuída",
        description: `${selectedProducts.length} produto(s) movidos temporariamente para "${targetCategory.name}" até ${formattedDate}.`,
      });
      
      setSelectedProducts([]);
      setShowTempCategoryDialog(false);
    } catch (error) {
      console.error("Erro ao atribuir categoria temporária:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atribuir a categoria temporária. Tente novamente.",
      });
    }
  };

  const getActiveTemporaryAssignments = () => {
    const now = new Date();
    return temporaryAssignments.filter(
      assignment => new Date(assignment.expireAt) > now
    );
  };

  const getProductById = (productId: string) => {
    return products?.find(p => p.id === productId);
  };

  const getCategoryById = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId);
  };

  const handleManualRevert = async (assignment: TempCategoryAssignment) => {
    try {
      await revertTemporaryAssignment(assignment);
      
      const storedAssignments = storageService.getItem<TempCategoryAssignment[]>(TEMP_CATEGORY_STORAGE_KEY) || [];
      const updatedAssignments = storedAssignments.filter(
        a => a.productId !== assignment.productId
      );
      
      storageService.setItem(TEMP_CATEGORY_STORAGE_KEY, updatedAssignments);
      setTemporaryAssignments(updatedAssignments);
      
      toast({
        title: "Categoria revertida",
        description: "O produto retornou para sua categoria original.",
      });
      
      refetch();
    } catch (error) {
      console.error("Erro ao reverter categoria temporária:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reverter a categoria. Tente novamente.",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
  };

  const handleRevertAllTemporaryAssignments = async () => {
    try {
      const activeAssignments = getActiveTemporaryAssignments();
      
      if (activeAssignments.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhuma atribuição temporária",
          description: "Não há atribuições temporárias ativas para reverter.",
        });
        return;
      }
      
      let revertedCount = 0;
      
      for (const assignment of activeAssignments) {
        try {
          const allProducts = storageService.getItem<Product[]>(PRODUCTS_STORAGE_KEY) || [];
          const product = allProducts.find(p => p.id === assignment.productId);
          
          if (!product) continue;
          
          const allCategories = storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY) || [];
          const originalCategory = allCategories.find(c => c.id === assignment.originalCategoryId);
          
          if (!originalCategory) continue;
          
          await saveProduct({
            ...product,
            category: originalCategory,
            updatedAt: new Date()
          }, {
            onSuccess: () => {},
            onError: () => {}
          });
          
          revertedCount++;
        } catch (error) {
          console.error(`Error reverting product ${assignment.productId}:`, error);
        }
      }
      
      storageService.setItem(TEMP_CATEGORY_STORAGE_KEY, []);
      setTemporaryAssignments([]);
      
      toast({
        title: "Categorias revertidas",
        description: `${revertedCount} produto(s) retornaram para suas categorias originais.`,
      });
      
      refetch();
    } catch (error) {
      console.error("Erro ao reverter todas as categorias temporárias:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reverter as categorias. Tente novamente.",
      });
    }
  };

  return (
    <Card className={`h-full ${fullWidth ? 'max-w-none' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md">Categorias</CardTitle>
        <div className="flex items-center space-x-2">
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
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="manage">Gerenciar Categorias</TabsTrigger>
            <TabsTrigger value="search">Reclassificar Produtos</TabsTrigger>
            <TabsTrigger value="temp">Categorias Temporárias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manage" className="space-y-4 pt-4">
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
              <div className={`grid gap-2 ${fullWidth ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}`}>
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate max-w-[50%]">{category.name}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{category.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
          </TabsContent>
          
          <TabsContent value="search" className="space-y-4 pt-4">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex items-center space-x-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produtos por nome ou código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {(searchQuery || categoryFilter) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearFilters}
                      className="h-10"
                    >
                      <X className="mr-1 h-3.5 w-3.5" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
              
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 bg-muted p-2 rounded-md">
                  <span className="text-sm font-medium">
                    {selectedProducts.length} produto(s) selecionado(s):
                  </span>
                  <Select onValueChange={(value) => handleMoveToCategory(value)}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="Mover para categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={handleOpenTempCategoryDialog}
                  >
                    <Clock className="mr-2 h-3.5 w-3.5" />
                    Categoria Temporária
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => setSelectedProducts([])}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Limpar seleção
                  </Button>
                </div>
              )}
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={selectedProducts.length > 0 && selectedProducts.length === filteredProducts.length} 
                          onCheckedChange={handleSelectAllProducts}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria Atual</TableHead>
                      <TableHead>Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          {searchQuery || categoryFilter ? "Nenhum produto corresponde aos filtros" : "Nenhum produto encontrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Checkbox 
                              checked={selectedProducts.includes(product.id)} 
                              onCheckedChange={() => handleSelectProduct(product.id)}
                              aria-label={`Selecionar ${product.name}`}
                            />
                          </TableCell>
                          <TableCell>{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="truncate max-w-[150px] inline-block">
                                    {product.category.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{product.category.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{formatCurrency(product.salePrice)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="temp" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Categorias Temporárias Ativas</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={checkExpiredAssignments}
                  >
                    <ArrowRight className="mr-2 h-3.5 w-3.5" />
                    Verificar Atualizações
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleRevertAllTemporaryAssignments}
                    className="bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:text-amber-900"
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Reverter Todas
                  </Button>
                </div>
              </div>
              
              {getActiveTemporaryAssignments().length === 0 ? (
                <div className="text-center p-4 border rounded-md text-muted-foreground text-sm">
                  Não há atribuições temporárias ativas no momento.
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria Original</TableHead>
                        <TableHead>Categoria Temporária</TableHead>
                        <TableHead>Retorna em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getActiveTemporaryAssignments().map((assignment) => {
                        const product = getProductById(assignment.productId);
                        const originalCategory = getCategoryById(assignment.originalCategoryId);
                        const tempCategory = getCategoryById(assignment.tempCategoryId);
                        
                        return (
                          <TableRow key={assignment.productId}>
                            <TableCell>{product?.name || "Produto não encontrado"}</TableCell>
                            <TableCell>{originalCategory?.name || "Categoria não encontrada"}</TableCell>
                            <TableCell>{tempCategory?.name || "Categoria não encontrada"}</TableCell>
                            <TableCell>
                              {new Date(assignment.expireAt).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManualRevert(assignment)}
                              >
                                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                Reverter
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
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
                <SelectTrigger>
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
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setCategoryToDelete(null);
                  setSelectedTargetCategory('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => categoryToDelete && handleConfirmDelete(categoryToDelete, selectedTargetCategory)}
                disabled={!selectedTargetCategory}
              >
                Confirmar migração e exclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={showTempCategoryDialog} onOpenChange={(open) => {
          if (!open) {
            setShowTempCategoryDialog(false);
            setSelectedTempCategory('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atribuir categoria temporária</DialogTitle>
              <DialogDescription>
                Selecione uma categoria temporária e o período de validade.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tempCategorySelect">Categoria temporária</Label>
                <Select
                  value={selectedTempCategory}
                  onValueChange={setSelectedTempCategory}
                >
                  <SelectTrigger id="tempCategorySelect">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={tempDuration}
                  onValueChange={setTempDuration}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {tempDuration === 'custom' && (
                <div className="space-y-2">
                  <Label>Data e hora de expiração</Label>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal w-full",
                            !customDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {customDate ? format(customDate, "dd/MM/yyyy") : "Selecione uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={customDate}
                          onSelect={(date) => date && setCustomDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <div className="flex space-x-1 items-center">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={customTimeHours}
                        onChange={(e) => setCustomTimeHours(e.target.value)}
                        className="w-16"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={customTimeMinutes}
                        onChange={(e) => setCustomTimeMinutes(e.target.value)}
                        className="w-16"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowTempCategoryDialog(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAssignTempCategory}
                disabled={!selectedTempCategory}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
