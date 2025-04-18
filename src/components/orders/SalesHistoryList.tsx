import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShoppingBag, Search, X, CreditCard, Tag, Percent, User, ChevronDown, ChevronUp, Gift, DollarSign, CalendarIcon, Printer } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { format, isAfter, isBefore, isValid, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sale, Promotion, User as UserType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export const SalesHistoryList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>({});
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  
  const { users } = useAuth();
  const salesHistory = (storageService.getItem(STORAGE_KEYS.ORDERS) || []) as Sale[];
  const allPromotions = (storageService.getItem(STORAGE_KEYS.PROMOTIONS) || []) as Promotion[];
  
  const formatSaleId = (id: string): string => {
    if (!id) return "N/A";
    return id.slice(-5);
  };
  
  const formatCPF = (cpf: string) => {
    if (!cpf) return "";
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length === 11) {
      return cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };
  
  const isWithinDateRange = (saleDate: Date) => {
    if (!startDate && !endDate) return true;
    
    if (startDate && !endDate) {
      return isAfter(saleDate, startOfDay(startDate)) || saleDate.getTime() === startOfDay(startDate).getTime();
    }
    
    if (!startDate && endDate) {
      return isBefore(saleDate, endOfDay(endDate)) || saleDate.getTime() === endOfDay(endDate).getTime();
    }
    
    if (startDate && endDate) {
      return (
        (isAfter(saleDate, startOfDay(startDate)) || saleDate.getTime() === startOfDay(startDate).getTime()) && 
        (isBefore(saleDate, endOfDay(endDate)) || saleDate.getTime() === endOfDay(endDate).getTime())
      );
    }
    
    return true;
  };
  
  const filteredSales = salesHistory.filter((sale: Sale) => {
    const query = searchQuery.toLowerCase();
    
    // First check date range
    const saleDate = new Date(sale.createdAt);
    if (!isWithinDateRange(saleDate)) {
      return false;
    }
    
    // Then check text search
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
    
    return query === '';
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

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };
  
  const formatSaleDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return "Data inválida";
    }
  };
  
  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
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

  const hasActiveFilters = !!startDate || !!endDate;
  
  if (sortedSales.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma venda encontrada</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {(searchQuery || hasActiveFilters) ? 
                "Nenhuma venda corresponde à sua pesquisa ou filtros. Tente outros termos ou datas." :
                "O histórico de vendas será exibido aqui quando você realizar vendas."
              }
            </p>
            
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={clearDateFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Limpar filtros de data
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const printReceipt = (sale: Sale) => {
    if (!sale) return;
    
    const receiptContent = generateReceiptContent(sale);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Recibo de Venda #${sale.id}</title>
            <style>
              body {
                font-family: monospace;
                width: 300px;
                margin: 0 auto;
                padding: 10px;
              }
              .header {
                text-align: center;
                margin-bottom: 15px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .item-row {
                display: flex;
                justify-content: space-between;
              }
              .receipt-total {
                font-weight: bold;
                margin-top: 15px;
              }
              .center {
                text-align: center;
              }
              @media print {
                @page {
                  size: 80mm auto; /* Point of Sale receipt width */
                  margin: 0;
                }
                body {
                  width: 100%;
                  padding: 5px;
                }
              }
            </style>
          </head>
          <body>
            ${receiptContent}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };
  
  const generateReceiptContent = (sale: any): string => {
    const date = new Date(sale.createdAt);
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR');
    
    let receipt = `
      <div class="header">
        <h2>Natura Essencia</h2>
        <p>CNPJ: 12.345.678/0001-90</p>
        <p>Rua Exemplo, 123 - Centro</p>
        <p>Tel: (11) 9876-5432</p>
      </div>
      <div class="divider"></div>
      <p><strong>RECIBO DE VENDA #${sale.id}</strong></p>
      <p>Data: ${formattedDate} ${formattedTime}</p>
      ${sale.customer ? `<p>Cliente: ${sale.customer.name}</p>` : ''}
      <p>Vendedor: ${sale.seller?.name || 'Não identificado'}</p>
      <div class="divider"></div>
    `;
    
    receipt += `<p><strong>ITENS</strong></p>`;
    sale.items.forEach((item: any) => {
      receipt += `
        <div class="item-row">
          <span>${item.quantity}x ${item.name}</span>
          <span>R$ ${item.subtotal.toFixed(2)}</span>
        </div>
        <div style="font-size: 0.8em; color: #666; margin-bottom: 5px;">
          R$ ${item.price.toFixed(2)} cada
        </div>
      `;
    });
    
    receipt += `
      <div class="divider"></div>
      <div class="item-row">
        <span>Subtotal:</span>
        <span>R$ ${sale.total.toFixed(2)}</span>
      </div>
    `;
    
    if (sale.discount > 0) {
      receipt += `
        <div class="item-row">
          <span>Desconto:</span>
          <span>-R$ ${sale.discount.toFixed(2)}</span>
        </div>
      `;
    }
    
    receipt += `
      <div class="item-row receipt-total">
        <span>TOTAL:</span>
        <span>R$ ${sale.finalTotal.toFixed(2)}</span>
      </div>
    `;
    
    receipt += `
      <div class="divider"></div>
      <p><strong>FORMA DE PAGAMENTO</strong></p>
    `;
    
    if (sale.paymentMethod === 'mixed' && sale.paymentDetails.payments) {
      sale.paymentDetails.payments.forEach((payment: any) => {
        const methodNames: { [key: string]: string } = {
          'credit_card': 'Cartão de Crédito',
          'debit_card': 'Cartão de Débito',
          'pix': 'PIX',
          'cash': 'Dinheiro'
        };
        
        const method = methodNames[payment.method] || payment.method;
        
        receipt += `
          <div class="item-row">
            <span>${method}:</span>
            <span>R$ ${payment.amount.toFixed(2)}</span>
          </div>
        `;
        
        if (payment.method === 'credit_card' && payment.installments > 1) {
          receipt += `<p style="font-size: 0.8em;">${payment.installments}x de R$ ${(payment.amount / payment.installments).toFixed(2)}</p>`;
        }
        
        if (payment.method === 'cash' && payment.change) {
          receipt += `
            <div class="item-row" style="font-size: 0.9em;">
              <span>Recebido:</span>
              <span>R$ ${payment.cashReceived.toFixed(2)}</span>
            </div>
            <div class="item-row" style="font-size: 0.9em;">
              <span>Troco:</span>
              <span>R$ ${payment.change.toFixed(2)}</span>
            </div>
          `;
        }
      });
    } else {
      const methodNames: { [key: string]: string } = {
        'credit_card': 'Cartão de Crédito',
        'debit_card': 'Cartão de Débito',
        'pix': 'PIX',
        'cash': 'Dinheiro'
      };
      
      const method = methodNames[sale.paymentMethod] || sale.paymentMethod;
      
      receipt += `
        <div class="item-row">
          <span>${method}:</span>
          <span>R$ ${sale.finalTotal.toFixed(2)}</span>
        </div>
      `;
      
      if (sale.paymentMethod === 'credit_card' && sale.paymentDetails.installments > 1) {
        receipt += `<p style="font-size: 0.8em;">${sale.paymentDetails.installments}x de R$ ${(sale.finalTotal / sale.paymentDetails.installments).toFixed(2)}</p>`;
      }
      
      if (sale.paymentMethod === 'cash' && sale.paymentDetails.change) {
        receipt += `
          <div class="item-row" style="font-size: 0.9em;">
            <span>Recebido:</span>
            <span>R$ ${sale.paymentDetails.cashReceived.toFixed(2)}</span>
          </div>
          <div class="item-row" style="font-size: 0.9em;">
            <span>Troco:</span>
            <span>R$ ${sale.paymentDetails.change.toFixed(2)}</span>
          </div>
        `;
      }
    }
    
    receipt += `
      <div class="divider"></div>
      <p class="center">Obrigado pela preferência!</p>
      <p class="center" style="font-size: 0.8em;">Natura Essencia - Beleza e Saúde</p>
    `;
    
    return receipt;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
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
        
        <div className="flex gap-2">
          <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Filtrar por data</span>
                {hasActiveFilters && (
                  <Badge variant="default" className="text-xs h-5 px-1 py-0 bg-primary-foreground text-primary">
                    Ativo
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Filtrar por período</h4>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data inicial</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !startDate && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? formatDisplayDate(startDate) : <span>Selecionar</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data final</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${
                              !endDate && "text-muted-foreground"
                            }`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? formatDisplayDate(endDate) : <span>Selecionar</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            className="pointer-events-auto"
                            disabled={(date) => startDate ? date < startDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Button 
                      variant="ghost" 
                      onClick={clearDateFilters}
                      disabled={!startDate && !endDate}
                    >
                      Limpar
                    </Button>
                    <Button onClick={() => setIsDateFilterOpen(false)}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearDateFilters}
              title="Limpar filtros de data"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>
            Filtrando por período: 
            {startDate ? ` de ${formatDisplayDate(startDate)}` : ''} 
            {endDate ? ` até ${formatDisplayDate(endDate)}` : ''}
          </span>
        </div>
      )}

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
                      <h3 className="font-medium">Venda #{formatSaleId(sale.id)}</h3>
                      
                      {sale.customer && (
                        <Badge variant="outline" className="ml-2">
                          Cliente: {sale.customer.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <CalendarIcon className="h-3 w-3 mr-1" />
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
                              <>
                                <div className="flex justify-between text-sm">
                                  <span>Cliente:</span>
                                  <span>{sale.customer.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>CPF:</span>
                                  <span>{formatCPF(sale.customer.cpf)}</span>
                                </div>
                                {sale.customer.phone && (
                                  <div className="flex justify-between text-sm">
                                    <span>Telefone:</span>
                                    <span>{sale.customer.phone}</span>
                                  </div>
                                )}
                              </>
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
                  
                  <div className="px-4 pb-4 flex justify-end mt-4 border-t pt-4">
                    <Button
                      onClick={() => printReceipt(sale)}
                      variant="outline"
                      className="flex items-center"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Reimprimir Cupom
                    </Button>
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
