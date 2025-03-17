import React, { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { 
  Accordion, AccordionContent, AccordionItem, AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, ShoppingBag, Calendar, User, CreditCard, 
  Percent, Gift, DollarSign, Tag 
} from 'lucide-react';
import { Sale, CartItem, Customer, User as UserType, PaymentMethod, MixedPayment } from '@/types';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';
import { useFetchProducts } from '@/hooks/use-products';
import { useFetchPromotions } from '@/hooks/use-promotions';

export const SalesHistoryList = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  
  const { data: products = [] } = useFetchProducts();
  const { data: promotions = [] } = useFetchPromotions();

  useEffect(() => {
    const loadSales = () => {
      const savedSales = storageService.getItem<Sale[]>(STORAGE_KEYS.ORDERS) || [];
      const sortedSales = savedSales.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSales(sortedSales);
    };

    loadSales();
  }, []);

  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    let filtered: Sale[];
    switch(timeFilter) {
      case 'today':
        filtered = sales.filter(sale => 
          new Date(sale.createdAt) >= today
        );
        break;
      case 'week':
        filtered = sales.filter(sale => 
          new Date(sale.createdAt) >= oneWeekAgo
        );
        break;
      case 'month':
        filtered = sales.filter(sale => 
          new Date(sale.createdAt) >= oneMonthAgo
        );
        break;
      default:
        filtered = sales;
    }
    
    setFilteredSales(filtered);
  }, [sales, timeFilter]);

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    const methods = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      transfer: 'Transferência',
      mixed: 'Pagamento Misto'
    };
    return methods[method] || method;
  };

  const isMixedPayment = (paymentDetails: any): paymentDetails is MixedPayment => {
    return paymentDetails && typeof paymentDetails === 'object' && 'payments' in paymentDetails;
  };

  const getProductName = (item: CartItem): string => {
    // First check if we have a complete product with name in the item itself
    if (item.product && typeof item.product.name === 'string' && item.product.name.trim() !== '') {
      return item.product.name;
    }
    
    // If we only have an ID, try to find the product in our products list
    if (item.product && item.product.id) {
      const foundProduct = products.find(p => p.id === item.product.id);
      if (foundProduct && foundProduct.name) {
        return foundProduct.name;
      }
    }
    
    // Fixed: Instead of checking for productId which doesn't exist on CartItem, 
    // we check if product.id exists directly
    if (item.product && item.product.id) {
      const foundProduct = products.find(p => p.id === item.product.id);
      if (foundProduct && foundProduct.name) {
        return foundProduct.name;
      }
    }
    
    // Last resort, check if the item itself has a name property
    if ('name' in item && typeof item.name === 'string' && item.name.trim() !== '') {
      return item.name;
    }
    
    return 'Produto não disponível';
  };

  const getPromotionDetails = (sale: Sale) => {
    if (!sale.appliedPromotionId) return null;
    
    const promotion = promotions.find(p => p.id === sale.appliedPromotionId);
    if (promotion) {
      return promotion;
    }
    
    // If we can't find the promotion details, at least return the ID
    return { 
      id: sale.appliedPromotionId,
      name: `Promoção #${sale.appliedPromotionId.substring(0, 8)}`,
      description: 'Detalhes completos não disponíveis'
    };
  };

  return (
    <div className="space-y-6">
      <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as any)}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="week">Última Semana</TabsTrigger>
          <TabsTrigger value="month">Último Mês</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {filteredSales.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <p className="text-muted-foreground">Nenhuma venda encontrada para o período selecionado.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredSales.map((sale) => (
            <AccordionItem key={sale.id} value={sale.id || ''} className="border rounded-lg overflow-hidden">
              <Card>
                <CardHeader className="pb-0">
                  <AccordionTrigger className="flex justify-between w-full pt-0 pb-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between w-full">
                      <div className="flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                        <CardTitle className="text-base font-medium mr-2">
                          Venda #{sale.id?.substring(0, 8) || 'N/A'}
                        </CardTitle>
                        <Badge variant="outline" className="ml-2">
                          {sale.items?.reduce((acc, item) => acc + (item?.quantity || 0), 0) || 0} itens
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(sale.createdAt)}
                      </div>
                    </div>
                    <div className="text-lg font-bold">
                      {formatCurrency(sale.finalTotal || 0)}
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                
                <AccordionContent>
                  <CardContent className="pt-4">
                    <div className="space-y-6">
                      {sale.customer && (
                        <div className="border-b pb-4">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            Cliente
                          </h4>
                          <div className="text-sm">
                            <div><span className="font-medium">Nome:</span> {sale.customer.name}</div>
                            <div><span className="font-medium">CPF:</span> {sale.customer.cpf}</div>
                            {sale.customer.phone && (
                              <div><span className="font-medium">Telefone:</span> {sale.customer.phone}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="border-b pb-4">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Itens
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Qtd</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                              <TableHead className="text-right">Desconto</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sale.items?.map((item, index) => item && (
                              <TableRow key={index}>
                                <TableCell>
                                  {getProductName(item)}
                                </TableCell>
                                <TableCell className="text-right">{item.quantity || 0}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.price || 0)}</TableCell>
                                <TableCell className="text-right">
                                  {(item.discount || 0) > 0 ? formatCurrency((item.discount || 0) * (item.quantity || 0)) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(((item.price || 0) - (item.discount || 0)) * (item.quantity || 0))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {sale.appliedPromotionId && (
                        <div className="border-b pb-4">
                          <h4 className="font-semibold mb-2 flex items-center">
                            <Tag className="h-4 w-4 mr-2" />
                            Promoção Aplicada
                          </h4>
                          <div className="bg-muted p-3 rounded-md">
                            {(() => {
                              const promotionDetails = getPromotionDetails(sale);
                              return promotionDetails ? (
                                <div className="text-sm">
                                  <div><span className="font-medium">Nome:</span> {promotionDetails.name}</div>
                                  <div><span className="font-medium">Descrição:</span> {promotionDetails.description}</div>
                                  {sale.promotionDiscountAmount !== undefined && (
                                    <div><span className="font-medium">Desconto aplicado:</span> {formatCurrency(sale.promotionDiscountAmount || 0)}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  Promoção com ID: {sale.appliedPromotionId} (detalhes não disponíveis)
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      
                      <div className="border-b pb-4">
                        <h4 className="font-semibold mb-2 flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pagamento
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm">
                              <div className="mb-1">
                                <span className="font-medium">Método:</span> {getPaymentMethodName(sale.paymentMethod || 'cash')}
                              </div>
                              
                              {sale.paymentDetails && (
                                <>
                                  {isMixedPayment(sale.paymentDetails) ? (
                                    <div className="mt-2">
                                      <div className="font-medium mb-1">Pagamento Misto:</div>
                                      <ul className="list-disc list-inside pl-2 space-y-1">
                                        {sale.paymentDetails.payments?.map((payment, idx) => payment && (
                                          <li key={idx} className="text-sm">
                                            {getPaymentMethodName(payment.method || 'cash')}: {formatCurrency(payment.amount || 0)}
                                            {payment.method === 'credit_card' && payment.installments && payment.installments > 1 && 
                                              ` (${payment.installments}x)`}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : (
                                    <>
                                      {sale.paymentDetails.method === 'credit_card' && sale.paymentDetails.installments && sale.paymentDetails.installments > 1 && (
                                        <div className="mb-1">
                                          <span className="font-medium">Parcelamento:</span> {sale.paymentDetails.installments}x
                                        </div>
                                      )}
                                      {sale.paymentDetails.method === 'cash' && sale.paymentDetails.cashReceived && (
                                        <div className="mb-1">
                                          <span className="font-medium">Valor recebido:</span> {formatCurrency(sale.paymentDetails.cashReceived)}
                                        </div>
                                      )}
                                      {sale.paymentDetails.method === 'cash' && sale.paymentDetails.change && (
                                        <div className="mb-1">
                                          <span className="font-medium">Troco:</span> {formatCurrency(sale.paymentDetails.change)}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(sale.total || 0)}</span>
                              </div>
                              
                              {(sale.discount || 0) > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span className="flex items-center">
                                    <Percent className="h-3 w-3 mr-1" />
                                    Desconto:
                                  </span>
                                  <span>-{formatCurrency(sale.discount || 0)}</span>
                                </div>
                              )}
                              
                              {(sale.discount > 0) && sale.discountAuthorizedBy && (
                                <div className="flex justify-between text-amber-600 text-xs italic">
                                  <span>Desconto autorizado por:</span>
                                  <span>
                                    {sale.discountAuthorizedBy && typeof sale.discountAuthorizedBy === 'object' && 'name' in sale.discountAuthorizedBy
                                      ? (sale.discountAuthorizedBy.name || 'Usuário não identificado')
                                      : 'Usuário não identificado'}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex justify-between font-bold pt-1 border-t">
                                <span>Total:</span>
                                <span>{formatCurrency(sale.finalTotal || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Informações Adicionais</h4>
                        <div className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {sale.seller && (
                            <div>
                              <span className="font-medium">Vendedor:</span> {sale.seller.name || 'Não informado'}
                            </div>
                          )}
                          <div><span className="font-medium">Data/Hora:</span> {formatDate(sale.createdAt)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};
