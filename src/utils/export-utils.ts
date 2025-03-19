
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CashierOperation } from '@/services/cashier-operations-service';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';

interface ExportData {
  operations: CashierOperation[];
  cashierName: string;
  getUserName: (userId: string) => string;
  operationsGroupedByDay?: any[];
}

// Format date for export files
const formatDate = (date: Date) => {
  return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
};

// Get operation type in Portuguese
const getOperationTypeName = (type: string): string => {
  switch (type) {
    case 'open': return 'Abertura';
    case 'close': return 'Fechamento';
    case 'deposit': return 'Suprimento';
    case 'withdrawal': return 'Sangria';
    default: return type;
  }
};

// Get sales data for a specific cashier
const getCashierSalesData = (cashierId: string, startDate: Date) => {
  // Get all orders
  const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
  
  // Filter orders by cashier and date
  return orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    // Fixed: Properly ensure we're checking for orders associated with this cashier
    return orderDate >= startDate && order.cashierId === cashierId;
  });
};

// Export to Excel
export const exportToExcel = (data: ExportData) => {
  const { operations, cashierName, getUserName } = data;
  
  // Create operations worksheet data
  const operationsData = operations.map(op => ({
    'Data': formatDate(new Date(op.timestamp)),
    'Tipo': getOperationTypeName(op.operationType),
    'Operador': getUserName(op.userId),
    'Valor': op.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    'Motivo': op.reason || '-',
    'Autorizado por': op.managerName || '-',
  }));

  // Find the opening operation to get sales since that time
  const openingOps = operations
    .filter(op => op.operationType === 'open')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  let salesData: any[] = [];
  if (openingOps.length > 0) {
    const latestOpening = openingOps[0];
    // Fixed: Get all sales related to the cashier since opening
    const sales = getCashierSalesData(latestOpening.cashierId, new Date(latestOpening.timestamp));
    
    salesData = sales.map(sale => ({
      'ID Venda': sale.id,
      'Data': formatDate(new Date(sale.createdAt)),
      'Valor Total': sale.finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      'Forma de Pagamento': getPaymentMethodName(sale.paymentMethod),
      'Cliente': sale.customer?.name || '-',
      'Itens': sale.items.length,
    }));
  }

  // Create workbook with multiple sheets
  const wb = XLSX.utils.book_new();
  
  // Add operations sheet
  const operationsWs = XLSX.utils.json_to_sheet(operationsData);
  XLSX.utils.book_append_sheet(wb, operationsWs, "Operações");
  
  // Add sales sheet
  const salesWs = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, salesWs, "Vendas");
  
  // If there are sales with payment details, create payment breakdown sheet
  if (salesData.length > 0) {
    const paymentData = getPaymentBreakdownData(operations);
    const paymentWs = XLSX.utils.json_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(wb, paymentWs, "Pagamentos");
  }
  
  // Generate filename based on cashier name and current date
  const dateStr = format(new Date(), "dd-MM-yyyy_HH-mm", { locale: ptBR });
  const fileName = `Caixa_${cashierName.replace(/\s/g, '_')}_${dateStr}.xlsx`;
  
  // Write and download file
  XLSX.writeFile(wb, fileName);
};

// Export to PDF
export const exportToPDF = (data: ExportData) => {
  const { operations, cashierName, getUserName } = data;
  
  // Create new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(`Relatório do Caixa: ${cashierName}`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 30);
  
  // Add operations table
  doc.setFontSize(12);
  doc.text("Operações de Caixa", 14, 40);
  
  const operationsData = operations.map(op => [
    formatDate(new Date(op.timestamp)),
    getOperationTypeName(op.operationType),
    getUserName(op.userId),
    op.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    op.reason || '-',
    op.managerName || '-',
  ]);
  
  // Fixed: Properly typecast doc to use autoTable
  (doc as any).autoTable({
    startY: 45,
    head: [['Data', 'Tipo', 'Operador', 'Valor', 'Motivo', 'Autorizado por']],
    body: operationsData,
    theme: 'grid', // Add theme for better visibility
    headStyles: { fillColor: [41, 128, 185] }, // Add styling to headers
  });
  
  // Find the opening operation to get sales since that time
  const openingOps = operations
    .filter(op => op.operationType === 'open')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  if (openingOps.length > 0) {
    const latestOpening = openingOps[0];
    // Fixed: Get cashier sales with proper date handling
    const sales = getCashierSalesData(latestOpening.cashierId, new Date(latestOpening.timestamp));
    
    if (sales.length > 0) {
      // Add sales table
      // Fixed: Use proper positioning based on the previous table
      const currentY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Vendas Realizadas", 14, currentY);
      
      const salesData = sales.map(sale => [
        sale.id.substring(0, 8),
        formatDate(new Date(sale.createdAt)),
        sale.finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        getPaymentMethodName(sale.paymentMethod),
        sale.items.length.toString(),
      ]);
      
      // Fixed: Properly add sales table
      (doc as any).autoTable({
        startY: currentY + 5,
        head: [['ID', 'Data', 'Valor Total', 'Pagamento', 'Itens']],
        body: salesData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });
      
      // Add payment summary table if there are sales
      const paymentData = getPaymentBreakdownData(operations);
      const paymentRows = paymentData.map(payment => [
        payment['Forma de Pagamento'],
        payment['Valor Total']
      ]);
      
      // Fixed: Proper positioning for payment breakdown table
      const paymentY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Resumo de Pagamentos", 14, paymentY);
      
      (doc as any).autoTable({
        startY: paymentY + 5,
        head: [['Forma de Pagamento', 'Valor Total']],
        body: paymentRows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });
    }
  }
  
  // Generate filename based on cashier name and current date
  const dateStr = format(new Date(), "dd-MM-yyyy_HH-mm", { locale: ptBR });
  const fileName = `Caixa_${cashierName.replace(/\s/g, '_')}_${dateStr}.pdf`;
  
  // Save the PDF
  doc.save(fileName);
};

// Helper to get payment method display name
const getPaymentMethodName = (method: string): string => {
  switch (method) {
    case 'cash': return 'Dinheiro';
    case 'credit_card': return 'Cartão de Crédito';
    case 'debit_card': return 'Cartão de Débito';
    case 'pix': return 'Pix';
    case 'mixed': return 'Pagamento Misto';
    default: return method;
  }
};

// Get payment breakdown data for reports
const getPaymentBreakdownData = (operations: CashierOperation[]) => {
  // Default payment methods
  const methods = [
    { method: 'Dinheiro', value: 0 },
    { method: 'Cartão de Crédito', value: 0 },
    { method: 'Cartão de Débito', value: 0 },
    { method: 'Pix', value: 0 },
  ];
  
  // Find the opening operation
  const openingOps = operations
    .filter(op => op.operationType === 'open')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  if (openingOps.length === 0) return methods;
  
  const latestOpening = openingOps[0];
  const orders = storageService.getItem<any[]>(STORAGE_KEYS.ORDERS) || [];
  
  // Fixed: Filter orders by cashier and ensure date comparison is consistent
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= new Date(latestOpening.timestamp) && order.cashierId === latestOpening.cashierId;
  });
  
  // Process orders to get payment breakdown
  filteredOrders.forEach(order => {
    if (order.paymentMethod === 'mixed' && order.paymentDetails?.payments) {
      // Handle mixed payments
      order.paymentDetails.payments.forEach((payment: any) => {
        const methodName = getPaymentMethodName(payment.method);
        const method = methods.find(m => m.method === methodName);
        if (method) {
          method.value += payment.amount;
        }
      });
    } else {
      // Handle single payment
      const methodName = getPaymentMethodName(order.paymentMethod);
      const method = methods.find(m => m.method === methodName);
      if (method) {
        method.value += order.finalTotal;
      }
    }
  });
  
  return methods.map(m => ({
    'Forma de Pagamento': m.method,
    'Valor Total': m.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  }));
};
