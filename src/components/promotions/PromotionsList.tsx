
import React, { useState, useEffect } from 'react';
import { useFetchPromotions, useDeletePromotion } from '@/hooks/use-promotions';
import { useFetchProducts } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-products';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Promotion, PromotionType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Edit, Trash2, AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

interface PromotionsListProps {
  onEditPromotion: (promotionId: string) => void;
}

// Utility function to get promotion type display name
const getPromotionTypeLabel = (type: PromotionType): string => {
  const labels: Record<PromotionType, string> = {
    discount_percentage: 'Desconto Percentual',
    discount_value: 'Desconto em Valor',
    buy_x_get_y: 'Compre X Leve Y',
    fixed_price: 'Preço Fixo',
    bundle: 'Pacote de Produtos',
  };
  return labels[type] || type;
};

export default function PromotionsList({ onEditPromotion }: PromotionsListProps) {
  const { data: promotions = [], isLoading } = useFetchPromotions();
  const { data: products = [] } = useFetchProducts();
  const { data: categories = [] } = useCategories();
  const { mutate: deletePromotion } = useDeletePromotion();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [deletedPromotionIds, setDeletedPromotionIds] = useState<string[]>([]);

  // Load deleted promotion IDs from localStorage on component mount
  useEffect(() => {
    const deletedIds = JSON.parse(localStorage.getItem('deletedPromotionIds') || '[]');
    setDeletedPromotionIds(deletedIds);
  }, []);

  // Save deleted promotion IDs to localStorage when they change
  useEffect(() => {
    if (deletedPromotionIds.length > 0) {
      localStorage.setItem('deletedPromotionIds', JSON.stringify(deletedPromotionIds));
    }
  }, [deletedPromotionIds]);

  // Get product name by id
  const getProductName = (productId?: string) => {
    if (!productId) return 'Todos os produtos';
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Produto não encontrado';
  };

  // Get category name by id
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Todas as categorias';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Categoria não encontrada';
  };

  // Format promotion details
  const getPromotionDetails = (promotion: Promotion): string => {
    switch (promotion.type) {
      case 'discount_percentage':
        return `${promotion.discountPercent}% de desconto em ${promotion.categoryId ? getCategoryName(promotion.categoryId) : getProductName(promotion.productId)}`;
      case 'discount_value':
        return `${formatCurrency(promotion.discountValue || 0)} de desconto em ${promotion.categoryId ? getCategoryName(promotion.categoryId) : getProductName(promotion.productId)}`;
      case 'buy_x_get_y': {
        const mainProduct = getProductName(promotion.productId);
        const secondaryProduct = promotion.secondaryProductId ? getProductName(promotion.secondaryProductId) : mainProduct;
        const discountText = (promotion.secondaryProductDiscount || 0) < 100 
          ? `com ${promotion.secondaryProductDiscount}% de desconto` 
          : 'grátis';
        
        return `Compre ${promotion.buyQuantity} ${mainProduct} e leve ${promotion.getQuantity} ${secondaryProduct} ${discountText}`;
      }
      case 'fixed_price':
        return `Preço fixo de ${formatCurrency(promotion.fixedPrice || 0)} para ${getProductName(promotion.productId)}`;
      case 'bundle':
        return `Pacote de produtos por ${formatCurrency(promotion.bundlePrice || 0)}`;
      default:
        return promotion.description;
    }
  };

  // Check if a promotion is active
  const isPromotionActive = (promotion: Promotion): boolean => {
    const now = new Date();
    return promotion.isActive && 
           promotion.startDate <= now && 
           promotion.endDate >= now;
  };

  // Get status badge for promotion
  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    
    if (!promotion.isActive) {
      return <Badge variant="outline">Inativo</Badge>;
    }
    
    if (promotion.startDate > now) {
      return <Badge className="bg-yellow-500">Agendado</Badge>;
    }
    
    if (promotion.endDate < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    return <Badge className="bg-green-500">Ativo</Badge>;
  };

  // Filter promotions based on search and filters
  const filteredPromotions = promotions
    .filter(promotion => !deletedPromotionIds.includes(promotion.id))
    .filter(promotion => {
    // Filter by search term
    const matchesSearch = 
      promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by type
    const matchesType = typeFilter === 'all' || promotion.type === typeFilter;
    
    // Filter by status
    let matchesStatus = true;
    const now = new Date();
    
    if (statusFilter === 'active') {
      matchesStatus = promotion.isActive && promotion.startDate <= now && promotion.endDate >= now;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !promotion.isActive;
    } else if (statusFilter === 'scheduled') {
      matchesStatus = promotion.isActive && promotion.startDate > now;
    } else if (statusFilter === 'expired') {
      matchesStatus = promotion.endDate < now;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Handle delete confirmation
  const handleDeleteClick = (promotionId: string) => {
    setPromotionToDelete(promotionId);
  };

  // Handle actual deletion
  const handleConfirmDelete = () => {
    if (promotionToDelete) {
      // Add to deleted promotions state
      setDeletedPromotionIds(prev => [...prev, promotionToDelete]);
      
      deletePromotion(promotionToDelete, {
        onSuccess: () => {
          toast({
            title: 'Promoção excluída',
            description: 'A promoção foi excluída com sucesso',
          });
          setPromotionToDelete(null);
          
          // Store the deleted ID in localStorage for persistence
          const deletedIds = JSON.parse(localStorage.getItem('deletedPromotionIds') || '[]');
          if (!deletedIds.includes(promotionToDelete)) {
            deletedIds.push(promotionToDelete);
            localStorage.setItem('deletedPromotionIds', JSON.stringify(deletedIds));
          }
        },
        onError: () => {
          // Remove from deleted promotions state in case of error
          setDeletedPromotionIds(prev => prev.filter(id => id !== promotionToDelete));
          
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Ocorreu um erro ao excluir a promoção',
          });
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar promoções..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tipo de Promoção" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="discount_percentage">Desconto Percentual</SelectItem>
            <SelectItem value="discount_value">Desconto em Valor</SelectItem>
            <SelectItem value="buy_x_get_y">Compre X Leve Y</SelectItem>
            <SelectItem value="fixed_price">Preço Fixo</SelectItem>
            <SelectItem value="bundle">Pacote de Produtos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
            <SelectItem value="expired">Expirados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredPromotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg">Nenhuma promoção encontrada</h3>
          <p className="text-muted-foreground">
            Tente ajustar seus filtros ou crie uma nova promoção.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promotion: Promotion) => (
            <Card key={promotion.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{promotion.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getPromotionTypeLabel(promotion.type)}
                      </p>
                    </div>
                    {getStatusBadge(promotion)}
                  </div>
                  
                  <p className="text-sm mb-4">{getPromotionDetails(promotion)}</p>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Início: {formatDate(new Date(promotion.startDate))}</div>
                    <div>Término: {formatDate(new Date(promotion.endDate))}</div>
                  </div>
                </div>
                
                <div className="flex border-t">
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-none py-4"
                    onClick={() => onEditPromotion(promotion.id)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <div className="w-px bg-border"></div>
                  <Button 
                    variant="ghost" 
                    className="flex-1 rounded-none py-4 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(promotion.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={promotionToDelete !== null} 
        onOpenChange={(open) => !open && setPromotionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Promoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta promoção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
