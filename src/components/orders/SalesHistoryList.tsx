
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShoppingBag, Search, X, Calendar, CreditCard, Tag, Percent, User, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const SalesHistoryList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  
  // Get sales history from storage
  const salesHistory = storageService.getItem(STORAGE_KEYS.ORDERS) || [];
  
  // Filter sales based on search query
  const filteredSales = salesHistory.filter((sale: any) => {
    const query = searchQuery.toLowerCase();
    
    // Search by sale ID
    if (sale.id && sale.id.toString().toLowerCase().includes(query)) {
      return true;
    }
    
    // Search by customer name
    if (sale.customer && sale.customer.name && sale.customer.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search by payment method
    if (sale.paymentMethod && sale.paymentMethod.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search by seller name
    if (sale.seller && sale.seller.name && sale.seller.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search by product names in items
    if (sale.items && sale.items.some((item: any) => 
      item.name && item.name.toLowerCase().includes(query)
    )) {
      return true;
    }
    
    return false;
  });
  
  // Sort sales in descending order by creation date
  const sortedSales = [...filteredSales].sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
  
  // Toggle sale expansion
  const toggleSaleExpansion = (saleId: string) => {
    setExpandedSales(prev => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };
  
  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Format date
  const formatSaleDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  
  // Get payment method translated name
  const getPaymentMethodName = (method: string): string => {
    const methodMap: Record<string, string> = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX',
      'mixed': 'Pagamento Misto',
    };
    
    return methodMap[method] || method;
  };
  
  // Get payment method icon
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };
  
  // Get promotion details by ID
  const getPromotionDetails = (sale: any) => {
    // Get all promotions from storage
    const promotions = storageService.getItem(STORAGE_KEYS.PROMOTIONS) || [];
    
    // Find the promotion that matches the ID in the sale
    if (sale.appliedPromotionId) {
      const promotion = promotions.find((p: any) => p.id === sale.appliedPromotionId);
      if (promotion) {
        return promotion;
      }
    }
    
    return null;
  };
  
  // Get discount authorized by manager name
  const getDiscountAuthorizedByName = (sale: any) => {
    if (sale.discountAuthorizedBy) {
      // Get all users from storage
      const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
      
      // Find the user that matches the ID in the sale
      const user = users.find((u: any) => u.id === sale.discountAuthorizedBy);
      if (user) {
        return user.name;
      }
      
      // If we can't find the user, return the ID
      return sale.discountAuthorizedBy;
    }
    
    return "Desconhecido";
  };
  
  // Format mixed payment details
  const formatMixedPayment = (payment: any) => {
    if (!payment.payments || !Array.isArray(payment.payments)) {
      return "Detalhes não disponíveis";
    }
    
    return payment.payments.map((p: any) => (
      <div key={p.method} className="flex justify-between border-t pt-1 mt-1 text-sm">
        <span>{getPaymentMethodName(p.method)}</span>
        <span>{formatCurrency(p.amount)}</span>
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
        {sortedSales.map((sale: any, index: number) => {
          const isExpanded = expandedSales[sale.id];
          const saleDate = formatSaleDate(sale.createdAt);
          const promotionDetails = getPromotionDetails(sale);
          
          return (
            <Collapsible
              key={sale.id}
              open={isExpanded}
              onOpenChange={() => toggleSaleExpansion(sale.id)}
              className="border rounded-md overflow-hidden"
            >
              <div className="bg-card">
                {/* Sale header - always visible */}
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
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{saleDate}</span>
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
                
                {/* Sale details - visible when expanded */}
                <CollapsibleContent>
                  <div className="px-4 pb-4 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left column - Items and Seller */}
                      <div>
                        <h4 className="font-medium mb-2">Itens</h4>
                        <div className="space-y-2">
                          {sale.items.map((item: any, itemIndex: number) => (
                            <div key={itemIndex} className="flex justify-between text-sm">
                              <span>
                                {item.name} ({item.quantity}x)
                              </span>
                              <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Vendedor</h4>
                          <div className="flex items-center text-sm">
                            <User className="h-3 w-3 mr-1" />
                            <span>{sale.seller ? sale.seller.name : 'Não especificado'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right column - Summary and Payment */}
                      <div>
                        <h4 className="font-medium mb-2">Resumo</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(sale.total)}</span>
                          </div>
                          
                          {/* Display for promotion discount - Only shown when promotion exists */}
                          {sale.appliedPromotionId && sale.promotionDiscountAmount && sale.promotionDiscountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="flex items-center">
                                <Tag className="h-3 w-3 mr-1" />
                                Desconto da Promoção:
                              </span>
                              <span>-{formatCurrency(sale.promotionDiscountAmount)}</span>
                            </div>
                          )}
                          
                          {/* Display promotion name if it exists */}
                          {sale.appliedPromotionId && (
                            <div className="flex justify-between text-green-600 text-xs">
                              <span>Promoção Aplicada:</span>
                              <span>
                                {promotionDetails ? promotionDetails.name : "Promoção desconhecida"}
                              </span>
                            </div>
                          )}
                          
                          {/* Display for manual discount - Only shown when manual discount exists */}
                          {sale.discount && sale.discount > 0 && (
                            <div className="flex justify-between text-amber-600">
                              <span className="flex items-center">
                                <Percent className="h-3 w-3 mr-1" />
                                Desconto Gerencial:
                              </span>
                              <span>-{formatCurrency(sale.discount)}</span>
                            </div>
                          )}
                          
                          {/* Manager authorization for manual discount - Only shown when manual discount exists */}
                          {sale.discount && sale.discount > 0 && sale.discountAuthorizedBy && (
                            <div className="flex justify-between text-amber-600 text-xs">
                              <span>Autorizado por:</span>
                              <span>{getDiscountAuthorizedByName(sale)}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between font-bold pt-2 border-t mt-2">
                            <span>Total:</span>
                            <span>{formatCurrency(sale.finalTotal)}</span>
                          </div>
                        </div>
                        
                        {/* Payment details */}
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Pagamento</h4>
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>Método:</span>
                              <span>{getPaymentMethodName(sale.paymentMethod)}</span>
                            </div>
                            
                            {sale.paymentMethod === 'mixed' && sale.paymentDetails && (
                              <div className="mt-1">
                                {formatMixedPayment(sale.paymentDetails)}
                              </div>
                            )}
                            
                            {sale.paymentMethod === 'credit_card' && sale.paymentDetails && sale.paymentDetails.installments && (
                              <div className="flex justify-between mt-1">
                                <span>Parcelas:</span>
                                <span>{sale.paymentDetails.installments}x</span>
                              </div>
                            )}
                            
                            {sale.paymentMethod === 'cash' && sale.paymentDetails && sale.paymentDetails.change !== undefined && (
                              <div className="flex justify-between mt-1">
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
