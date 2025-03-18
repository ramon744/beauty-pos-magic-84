import { useQuery } from '@tanstack/react-query';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { Sale, Product, Customer } from '@/types';
import { formatCurrency } from '@/lib/formatters';

// Tipos para os relatórios
export interface SalesReportData {
  dailySales: {
    day: string;
    sales: number;
    transactions: number;
  }[];
  weeklySales: {
    week: string;
    sales: number;
    transactions: number;
  }[];
  monthlySales: {
    month: string;
    sales: number;
    transactions: number;
  }[];
  paymentMethods: {
    method: string;
    amount: number;
    percentage: number;
  }[];
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
}

export interface ProductsReportData {
  topProducts: {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  categoryDistribution: {
    category: string;
    count: number;
    percentage: number;
  }[];
  stockStatus: {
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
}

export interface CustomersReportData {
  newCustomers: {
    period: string;
    count: number;
  }[];
  topCustomers: {
    id: string;
    name: string;
    purchases: number;
    spent: number;
  }[];
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
}

// Função para gerar dados de relatório de vendas
const generateSalesReportData = (): SalesReportData => {
  const sales = storageService.getItem<Sale[]>(STORAGE_KEYS.ORDERS) || [];
  
  // Inicializa dados
  const dailySales: {[key: string]: {sales: number, transactions: number}} = {};
  const weeklySales: {[key: string]: {sales: number, transactions: number}} = {};
  const monthlySales: {[key: string]: {sales: number, transactions: number}} = {};
  const paymentMethods: {[key: string]: number} = {};
  
  let totalSales = 0;
  
  // Processa cada venda
  sales.forEach(sale => {
    const date = new Date(sale.createdAt);
    const day = date.toISOString().split('T')[0];
    const week = getWeekNumber(date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Diário
    if (!dailySales[day]) {
      dailySales[day] = { sales: 0, transactions: 0 };
    }
    dailySales[day].sales += sale.finalTotal || 0;
    dailySales[day].transactions += 1;
    
    // Semanal
    if (!weeklySales[week]) {
      weeklySales[week] = { sales: 0, transactions: 0 };
    }
    weeklySales[week].sales += sale.finalTotal || 0;
    weeklySales[week].transactions += 1;
    
    // Mensal
    if (!monthlySales[month]) {
      monthlySales[month] = { sales: 0, transactions: 0 };
    }
    monthlySales[month].sales += sale.finalTotal || 0;
    monthlySales[month].transactions += 1;
    
    // Métodos de pagamento
    const method = sale.paymentMethod || 'unknown';
    paymentMethods[method] = (paymentMethods[method] || 0) + (sale.finalTotal || 0);
    
    // Total
    totalSales += sale.finalTotal || 0;
  });
  
  // Converte para arrays
  const dailySalesArray = Object.entries(dailySales)
    .map(([day, data]) => ({
      day,
      sales: data.sales,
      transactions: data.transactions
    }))
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-30); // Últimos 30 dias
  
  const weeklySalesArray = Object.entries(weeklySales)
    .map(([week, data]) => ({
      week,
      sales: data.sales,
      transactions: data.transactions
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12); // Últimas 12 semanas
  
  const monthlySalesArray = Object.entries(monthlySales)
    .map(([month, data]) => ({
      month,
      sales: data.sales,
      transactions: data.transactions
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Últimos 12 meses
  
  // Processa métodos de pagamento
  const paymentMethodsArray = Object.entries(paymentMethods).map(([method, amount]) => ({
    method: formatPaymentMethod(method),
    amount,
    percentage: totalSales > 0 ? (amount / totalSales) * 100 : 0
  }));
  
  return {
    dailySales: dailySalesArray,
    weeklySales: weeklySalesArray,
    monthlySales: monthlySalesArray,
    paymentMethods: paymentMethodsArray,
    totalSales,
    totalTransactions: sales.length,
    averageTicket: sales.length > 0 ? totalSales / sales.length : 0
  };
};

// Função para gerar dados de relatório de produtos
const generateProductsReportData = (): ProductsReportData => {
  const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
  const sales = storageService.getItem<Sale[]>(STORAGE_KEYS.ORDERS) || [];
  
  // Contador de produtos vendidos
  const productSales: { [id: string]: { quantity: number, revenue: number, name: string } } = {};
  
  // Processa vendas para encontrar produtos mais vendidos
  sales.forEach(sale => {
    sale.items?.forEach(item => {
      // Fix: Access product ID correctly based on the structure
      const productId = typeof item.product === 'object' ? item.product?.id : item.product;
      if (!productId) return;
      
      if (!productSales[productId]) {
        // Fix: Correctly handle all possible item structures for the name with proper type casting
        let productName = 'Produto';
        
        if (typeof item.product === 'object' && item.product && 'name' in item.product) {
          productName = item.product.name as string;
        } else if (typeof item === 'object' && 'name' in item) {
          productName = item.name as string;
        }
            
        productSales[productId] = {
          quantity: 0,
          revenue: 0,
          name: productName
        };
      }
      
      productSales[productId].quantity += item.quantity;
      productSales[productId].revenue += item.price * item.quantity;
    });
  });
  
  // Top produtos
  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({
      id,
      name: data.name || 'Produto Desconhecido',
      quantity: data.quantity,
      revenue: data.revenue
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  // Distribuição por categoria
  const categories: { [category: string]: number } = {};
  products.forEach(product => {
    // Fix: Correctly access the category name
    const categoryName = typeof product.category === 'object' ? product.category?.name : product.category || 'Sem Categoria';
    categories[categoryName] = (categories[categoryName] || 0) + 1;
  });
  
  const categoryDistribution = Object.entries(categories)
    .map(([category, count]) => ({
      category,
      count,
      percentage: products.length > 0 ? (count / products.length) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  // Status de estoque
  const stockStatus = {
    inStock: products.filter(p => p.stock > (p.minimumStock || 0)).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= (p.minimumStock || 0)).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };
  
  return {
    topProducts,
    categoryDistribution,
    stockStatus
  };
};

// Função para gerar dados de relatório de clientes
const generateCustomersReportData = (): CustomersReportData => {
  const customers = storageService.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS) || [];
  const sales = storageService.getItem<Sale[]>(STORAGE_KEYS.ORDERS) || [];
  
  // Clientes por período (últimos 6 meses)
  const newCustomersByMonth: { [month: string]: number } = {};
  const now = new Date();
  
  // Inicializa os últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    newCustomersByMonth[monthKey] = 0;
  }
  
  // Preenche novos clientes por mês
  customers.forEach(customer => {
    const createdAt = new Date(customer.createdAt);
    const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    
    if (newCustomersByMonth[monthKey] !== undefined) {
      newCustomersByMonth[monthKey] += 1;
    }
  });
  
  const newCustomers = Object.entries(newCustomersByMonth)
    .map(([period, count]) => ({
      period,
      count
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
  
  // Top clientes
  const customerPurchases: { [id: string]: { purchases: number, spent: number, name: string } } = {};
  
  sales.forEach(sale => {
    const customerId = sale.customer?.id;
    if (!customerId) return;
    
    if (!customerPurchases[customerId]) {
      customerPurchases[customerId] = {
        purchases: 0,
        spent: 0,
        name: sale.customer?.name || 'Cliente Desconhecido'
      };
    }
    
    customerPurchases[customerId].purchases += 1;
    customerPurchases[customerId].spent += sale.finalTotal || 0;
  });
  
  const topCustomers = Object.entries(customerPurchases)
    .map(([id, data]) => ({
      id,
      name: data.name,
      purchases: data.purchases,
      spent: data.spent
    }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);
  
  // Clientes ativos (com pelo menos uma compra nos últimos 90 dias)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
  
  const activeCustomerIds = new Set<string>();
  sales.forEach(sale => {
    if (!sale.customer?.id) return;
    const saleDate = new Date(sale.createdAt);
    if (saleDate > threeMonthsAgo) {
      activeCustomerIds.add(sale.customer.id);
    }
  });
  
  return {
    newCustomers,
    topCustomers,
    totalCustomers: customers.length,
    activeCustomers: activeCustomerIds.size,
    inactiveCustomers: customers.length - activeCustomerIds.size
  };
};

// Função auxiliar para obter o número da semana
function getWeekNumber(date: Date): string {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Função auxiliar para formatar método de pagamento
function formatPaymentMethod(method: string): string {
  const methodMap: {[key: string]: string} = {
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'cash': 'Dinheiro',
    'pix': 'PIX',
    'mixed': 'Pagamento Misto'
  };
  
  return methodMap[method] || method;
}

// Hook para relatório de vendas
export function useSalesReports(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  return useQuery({
    queryKey: ['reports', 'sales', period],
    queryFn: () => {
      const data = generateSalesReportData();
      return data;
    },
  });
}

// Hook para relatório de produtos
export function useProductsReports() {
  return useQuery({
    queryKey: ['reports', 'products'],
    queryFn: () => {
      return generateProductsReportData();
    },
  });
}

// Hook para relatório de clientes
export function useCustomersReports() {
  return useQuery({
    queryKey: ['reports', 'customers'],
    queryFn: () => {
      return generateCustomersReportData();
    },
  });
}
