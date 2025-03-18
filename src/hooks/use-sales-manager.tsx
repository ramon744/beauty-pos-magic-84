import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useDiscounts } from '@/hooks/use-discounts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { PaymentDetails, MixedPayment } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DiscountFormValues, discountFormSchema } from '@/components/sales/DiscountForm';

export const useSalesManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isDiscountsListOpen, setIsDiscountsListOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<'manual' | 'promotion' | null>(null);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [discountAuthorizedBy, setDiscountAuthorizedBy] = useState<string | undefined>(undefined);
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const [isPrintReceiptDialogOpen, setIsPrintReceiptDialogOpen] = useState(false);

  const { 
    cart, 
    cartSubtotal, 
    linkedCustomer,
    addProductToCart, 
    updateCartItemQuantity, 
    removeFromCart, 
    clearCart, 
    setCart,
    linkCustomer,
    unlinkCustomer
  } = useCart();
  
  const { 
    manualDiscount, 
    appliedPromotion,
    availablePromotions,
    promotionDiscountAmount,
    manualDiscountAmount,
    totalDiscountAmount,
    cartTotal,
    appliedPromotionDetails,
    selectedPromotionId,
    handleSelectPromotion,
    removeDiscount,
    removePromotion,
    applyManualDiscount,
    resetDiscounts,
  } = useDiscounts(cart, cartSubtotal);

  const discountForm = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      discountType: 'percentage',
      discountValue: 0
    }
  });

  const generateSaleId = (): string => {
    const timestamp = Date.now();
    const shortId = String(timestamp).slice(-5);
    return shortId;
  };

  const handleManagerAuthConfirm = (managerId?: string) => {
    console.log("Manager auth confirmed with ID:", managerId);
    setDiscountAuthorizedBy(managerId);
    
    if (productIdToDelete === "discount") {
      const { discountType, discountValue } = discountForm.getValues();
      applyManualDiscount({
        type: discountType,
        value: discountValue
      });
    } else if (productIdToDelete === "clear-all") {
      doFinalizeSale();
    } else if (productIdToDelete === "delete-discount") {
      if (discountToDelete === 'manual') {
        removeDiscount();
      } else if (discountToDelete === 'promotion') {
        removePromotion();
      }
      setDiscountToDelete(null);
    } else if (productIdToDelete) {
      removeFromCart(productIdToDelete);
    }
    
    setProductIdToDelete(null);
    setIsManagerAuthOpen(false);
  };

  const requestManagerAuth = (callback: () => void) => {
    setIsManagerAuthOpen(true);
    setProductIdToDelete("manager-request");
    
    const managerAuthWrapper = (managerId?: string) => {
      setDiscountAuthorizedBy(managerId);
      callback();
      setIsManagerAuthOpen(false);
    };
    
    return managerAuthWrapper;
  };

  const initiateRemoveFromCart = (productId: string) => {
    setProductIdToDelete(productId);
    setIsManagerAuthOpen(true);
  };

  const handleCartItemQuantityUpdate = (productId: string, newQuantity: number) => {
    const result = updateCartItemQuantity(productId, newQuantity);
    if (result) {
      setProductIdToDelete(result);
      setIsManagerAuthOpen(true);
    }
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setProductIdToDelete("clear-all");
      setIsManagerAuthOpen(true);
    }
  };

  const doFinalizeSale = () => {
    clearCart();
    resetDiscounts();
    setDiscountReason("");
    setDiscountAuthorizedBy(undefined);
  };

  const handleOpenPaymentDialog = () => {
    setIsPaymentDialogOpen(true);
  };
  
  const updateProductStock = (saleItems: any[]) => {
    const products = storageService.getItem<any[]>(STORAGE_KEYS.PRODUCTS) || [];
    
    saleItems.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.id);
      if (productIndex !== -1) {
        products[productIndex].stock -= item.quantity;
        products[productIndex].updatedAt = new Date();
        
        const stockHistory = storageService.getItem<any[]>(STORAGE_KEYS.STOCKS) || [];
        stockHistory.push({
          id: crypto.randomUUID(),
          productId: item.id,
          date: new Date(),
          quantity: -item.quantity,
          type: 'decrease',
          reason: 'Venda finalizada'
        });
        storageService.setItem(STORAGE_KEYS.STOCKS, stockHistory);
      }
    });
    
    storageService.setItem(STORAGE_KEYS.PRODUCTS, products);
  };

  const handlePaymentConfirm = (paymentDetails: PaymentDetails | MixedPayment) => {
    console.log("Payment confirmed with discountAuthorizedBy:", discountAuthorizedBy);
    const order = {
      id: generateSaleId(),
      items: cart,
      customer: linkedCustomer,
      paymentMethod: 'payments' in paymentDetails ? 'mixed' : paymentDetails.method,
      total: cartSubtotal,
      discount: totalDiscountAmount,
      finalTotal: cartTotal,
      paymentDetails: paymentDetails,
      seller: user,
      createdAt: new Date(),
      appliedPromotionId: appliedPromotion?.promotionId,
      promotionDiscountAmount: promotionDiscountAmount,
      discountAuthorizedBy: discountAuthorizedBy,
      discountReason: discountReason
    };
    
    console.log("Saving order with discountAuthorizedBy:", order.discountAuthorizedBy);
    
    const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
    orders.push(order);
    storageService.setItem(STORAGE_KEYS.ORDERS, orders);
    
    updateProductStock(cart);
    
    let confirmationMessage = `Venda finalizada: R$ ${cartTotal.toFixed(2)}`;
    
    if ('payments' in paymentDetails) {
      confirmationMessage += ` | Pagamento misto com ${paymentDetails.payments.length} formas`;
    } else if (paymentDetails.method === 'credit_card' && paymentDetails.installments && paymentDetails.installments > 1) {
      confirmationMessage += ` em ${paymentDetails.installments}x`;
    } else if (paymentDetails.method === 'cash' && paymentDetails.change && paymentDetails.change > 0) {
      confirmationMessage += ` | Troco: R$ ${paymentDetails.change.toFixed(2)}`;
    }
    
    if (linkedCustomer) {
      confirmationMessage += ` | Cliente: ${linkedCustomer.name}`;
    }
    
    toast({
      title: "Pagamento confirmado",
      description: confirmationMessage
    });
    
    setIsPaymentDialogOpen(false);
    setLastCompletedSale(order);
    setIsPrintReceiptDialogOpen(true);
  };

  const finalizeSale = () => {
    if (cart.length > 0) {
      handleOpenPaymentDialog();
    }
  };

  const handleAddDiscount = () => {
    discountForm.reset({
      discountType: 'percentage',
      discountValue: 0
    });
    setIsDiscountDialogOpen(true);
  };

  const handleSubmitDiscount = (values: DiscountFormValues) => {
    setIsDiscountDialogOpen(false);
    setProductIdToDelete("discount");
    setIsManagerAuthOpen(true);
  };

  const handleOpenPromotions = () => {
    setIsPromotionDialogOpen(true);
  };

  const handleShowDiscountsList = () => {
    setIsDiscountsListOpen(true);
  };

  const handleDeleteDiscount = (discountType: 'manual' | 'promotion', reason?: string) => {
    setDiscountReason(reason || "");
    setDiscountToDelete(discountType);
    setProductIdToDelete("delete-discount");
    setIsDiscountsListOpen(false);
    setIsManagerAuthOpen(true);
  };

  const handleClosePrintDialog = () => {
    setIsPrintReceiptDialogOpen(false);
    doFinalizeSale();
  };

  const handlePrintReceipt = () => {
    if (lastCompletedSale) {
      const receiptContent = generateReceiptContent(lastCompletedSale);
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Recibo de Venda #${lastCompletedSale.id}</title>
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
    }
    
    handleClosePrintDialog();
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

  return {
    isManagerAuthOpen,
    isDiscountDialogOpen,
    isPromotionDialogOpen,
    isDiscountsListOpen,
    isPaymentDialogOpen,
    isPrintReceiptDialogOpen,
    discountReason,
    discountAuthorizedBy,
    discountForm,
    lastCompletedSale,
    
    cart,
    cartSubtotal,
    cartTotal,
    linkedCustomer,
    manualDiscount,
    appliedPromotion,
    availablePromotions,
    promotionDiscountAmount,
    manualDiscountAmount,
    totalDiscountAmount,
    appliedPromotionDetails,
    selectedPromotionId,
    
    handleManagerAuthConfirm,
    requestManagerAuth,
    initiateRemoveFromCart,
    handleCartItemQuantityUpdate,
    handleClearCart,
    handlePaymentConfirm,
    finalizeSale,
    handleAddDiscount,
    handleSubmitDiscount,
    handleOpenPromotions,
    handleShowDiscountsList,
    handleDeleteDiscount,
    handleSelectPromotion,
    linkCustomer,
    unlinkCustomer,
    handlePrintReceipt,
    handleClosePrintDialog,
    
    setIsManagerAuthOpen,
    setIsDiscountDialogOpen,
    setIsPromotionDialogOpen,
    setIsDiscountsListOpen,
    setIsPaymentDialogOpen,
    setDiscountReason,
    
    removeDiscount,
    removePromotion,
    addProductToCart
  };
};
