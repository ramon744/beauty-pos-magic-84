import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShoppingBag, Search, X, Calendar, CreditCard, Tag, Percent, User, ChevronDown, ChevronUp, Gift, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sale, Promotion, User as UserType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export const SalesHistoryList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  
  const { users } = useAuth();
  const salesHistory = (storageService.getItem(STORAGE_KEYS.ORDERS) || []) as Sale[];
  const allPromotions = (storageService.getItem(STORAGE_KEYS.PROMOTIONS) || []) as Promotion[];
  
  const filteredSales = salesHistory.filter((sale: Sale) => {
    const query = searchQuery.toLowerCase();
    
    if (sale.id && sale.id.toString().toLowerCase().includes(query)) {
      return true;
    }
    
    if (sale.customer && sale.customer.name && sale.customer.name.toLowerCase().includes(query)) {
      return true;
    }
    
    if (sale.paymentMethod && sale.paymentMethod.toLowerCase().includes(query)) {
      return true;
    }
    
    if (sale.seller && sale.seller.name && sale.seller.name.toLowerCase().includes(query)) {
      return true;
    }
    
    if (sale.items && sale.items.some((item: any) => 
      item.product && item.product.name && item.product.name.toLowerCase().includes(query)
    )) {
      return true;
    }
    
    return false;
  });
  
  const sortedSales = [...filteredSales].sort((a: Sale, b: Sale) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
  
  const toggleSaleExpansion = (saleId: string) => {
    setExpandedSales(prev => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const formatSaleDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  
  const getPaymentMethodName = (method: string): string => {
    const methodMap: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'transfer': 'Transferência',
      'mixed': 'Pagamento Misto',
    };
    
    return methodMap[method] || method;
  };
  
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'pix':
        return <CreditCard className="h-4 w-4" />;
      case 'transfer':
        return <CreditCard className="h-4 w-4" />;
      case 'mixed':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };
  
  const getPromotionDetails = (sale: Sale) => {
    if (sale.appliedPromotionId) {
      const promotion = allPromotions.find((p: Promotion) => p.id === sale.appliedPromotionId);
      return promotion || null;
    }
    return null;
  };
  
  const getDiscountAuthorizedByName = (sale: Sale) => {
    if (sale.discountAuthorizedBy) {
      const manager = users.find((u: UserType) => u.id === sale.discountAuthorizedBy);
      if (manager) {
        console.log("Found manager:", manager.name, "for ID:", sale.discountAuthorizedBy);
        return manager.name;
      } else {
        console.log("Manager not found for ID:", sale.discountAuthorizedBy);
      }
    } else {
      console.log("No discountAuthorizedBy in the sale:", sale);
    }
    
    return "Não identificado";
  };

  const getManualDiscountAmount = (sale: Sale) => {
    const totalDiscount = sale.discount || 0;
    const promotionDiscount = sale.promotionDiscountAmount || 0;
    return Math.max(0, totalDiscount - promotionDiscount);
  };
  
  const formatMixedPayment = (payment: any) => {
    if (!payment.payments || !Array.isArray(payment.payments)) {
      return "Detalhes não disponíveis";
    }
    
    return payment.payments.map((p: any) => (
      <div key={p.method} className="flex justify-between border-t pt-1 mt-1 text-sm">
        <span>{getPaymentMethodName(p.method)}</span>
        <span>{formatCurrency(p.amount || 0)}</span>
      </div>
    ));
  };
  
  if (sortedSales.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma venda encontrada</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery ? 
                "Nenhuma venda corresponde à sua pesquisa. Tente outros termos." :
                "O histórico de vendas será exibido aqui quando você realizar vendas."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar vendas por ID, cliente, vendedor ou produto..."
          className="pl-8 pr-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            onClick={clearSearch}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            aria-label="Limpar pesquisa"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {sortedSales.map((sale: Sale) => {
          const isExpanded = expandedSales[sale.id];
          const saleDate = formatSaleDate(sale.createdAt.toString());
          const promotionDetails = getPromotionDetails(sale);
          
          const promotionDiscountAmount = sale.promotionDiscountAmount || 0;
          const manualDiscountAmount = getManualDiscountAmount(sale);
          
          const hasPromotionDiscount = promotionDiscountAmount > 0;
          const hasManualDiscount = manualDiscountAmount > 0;
          
          const managerName = getDiscountAuthorizedByName(sale);
          
          return (
            <Collapsible
              key={sale.id}
              open={isExpanded}
              onOpenChange={() => toggleSaleExpansion(sale.id)}
              className="border rounded-md overflow-hidden"
            >
              <div className="bg-card">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Venda #{sale.id}</h3>
                      
                      {sale.customer && (
                        <Badge variant="outline" className="ml-2">
                          Cliente: {sale.customer.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{saleDate}</span>
                      
                      {sale.seller && (
                        <span className="flex items-center ml-3">
                          <User className="h-3 w-3 mr-1" />
                          Operador: {sale.seller.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="text-lg font-bold">{formatCurrency(sale.finalTotal)}</div>
                      <div className="flex items-center text-sm">
                        {getPaymentMethodIcon(sale.paymentMethod)}
                        <span className="ml-1">{getPaymentMethodName(sale.paymentMethod)}</span>
                      </div>
                    </div>
                    
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2 text-base flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          Itens
                        </h4>
                        <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                          {sale.items.map((item: any, itemIndex: number) => (
                            <div key={itemIndex} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {item.product?.name || item.name || 'Produto Desconhecido'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.quantity}x &times; {formatCurrency(item.price)}
                                </span>
                              </div>
                              <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium mb-2 text-base flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Informações da Venda
                          </h4>
                          <div className="border rounded-md p-3 bg-muted/20 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Operador:</span>
                              <span>{sale.seller ? sale.seller.name : 'Não especificado'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Data:</span>
                              <span>{saleDate}</span>
                            </div>
                            {sale.customer && (
                              <div className="flex justify-between text-sm">
                                <span>Cliente:</span>
                                <span>{sale.customer.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2 text-base flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Resumo Financeiro
                        </h4>
                        <div className="border rounded-md p-3 bg-muted/20 space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(sale.total)}</span>
                          </div>
                          
                          {hasPromotionDiscount && (
                            <div className="border-t pt-2 mt-2">
                              <div className="flex justify-between text-green-600 font-medium">
                                <span className="flex items-center">
                                  <Gift className="h-3 w-3 mr-1" />
                                  Desconto por Promoção:
                                </span>
                                <span>-{formatCurrency(promotionDiscountAmount)}</span>
                              </div>
                              {promotionDetails && (
                                <div className="flex justify-between text-green-600 text-xs mt-1">
                                  <span>Promoção:</span>
                                  <span className="font-medium">{promotionDetails.name}</span>
                                </div>
                              )}
                              {promotionDetails && promotionDetails.description && (
                                <div className="text-green-600 text-xs mt-1">
                                  <span>Descrição: {promotionDetails.description}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {hasManualDiscount && (
                            <div className={`${hasPromotionDiscount ? 'mt-2' : 'border-t pt-2 mt-2'}`}>
                              <div className="flex justify-between text-amber-600 font-medium">
                                <span className="flex items-center">
                                  <Percent className="h-3 w-3 mr-1" />
                                  Desconto Gerencial:
                                </span>
                                <span>-{formatCurrency(manualDiscountAmount)}</span>
                              </div>
                              {sale.discountAuthorizedBy && (
                                <div className="flex justify-between text-amber-600 text-xs mt-1">
                                  <span>Autorizado por:</span>
                                  <span className="font-medium">{managerName}</span>
                                </div>
                              )}
                              {sale.discountReason && (
                                <div className="text-amber-600 text-xs mt-1">
                                  <span>Motivo: {sale.discountReason}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex justify-between font-bold pt-2 border-t mt-2">
                            <span>Total:</span>
                            <span>{formatCurrency(sale.finalTotal)}</span>
                          </div>
                          
                          {(hasPromotionDiscount || hasManualDiscount) && (
                            <div className="flex justify-between text-sm text-green-600">
                              <span>Economia Total:</span>
                              <span>{formatCurrency(promotionDiscountAmount + manualDiscountAmount)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium mb-2 text-base flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pagamento
                          </h4>
                          <div className="border rounded-md p-3 bg-muted/20 space-y-2">
                            <div className="flex justify-between">
                              <span>Método:</span>
                              <div className="flex items-center">
                                {getPaymentMethodIcon(sale.paymentMethod)}
                                <span className="ml-1">{getPaymentMethodName(sale.paymentMethod)}</span>
                              </div>
                            </div>
                            
                            {sale.paymentMethod === 'mixed' && sale.paymentDetails && (
                              <div className="border-t pt-2">
                                <h5 className="text-sm font-medium mb-1">Detalhes do pagamento misto:</h5>
                                {formatMixedPayment(sale.paymentDetails)}
                              </div>
                            )}
                            
                            {sale.paymentMethod === 'credit_card' && sale.paymentDetails && sale.paymentDetails.installments && (
                              <div className="flex justify-between">
                                <span>Parcelas:</span>
                                <span>{sale.paymentDetails.installments}x</span>
                              </div>
                            )}
                            
                            {sale.paymentMethod === 'cash' && sale.paymentDetails && sale.paymentDetails.cashReceived !== undefined && (
                              <div className="flex justify-between">
                                <span>Valor Recebido:</span>
                                <span>{formatCurrency(sale.paymentDetails.cashReceived)}</span>
                              </div>
                            )}
                            
                            {sale.paymentMethod === 'cash' && sale.paymentDetails && sale.paymentDetails.change !== undefined && (
                              <div className="flex justify-between">
                                <span>Troco:</span>
                                <span>{formatCurrency(sale.paymentDetails.change)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};
