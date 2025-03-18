
import { useQuery } from '@tanstack/react-query';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { Product, Sale, Customer } from '@/types';

// Get the list of products with low stock
export function useProductsWithLowStock() {
  const { data: products, isLoading } = useProducts();
  
  return useQuery({
    queryKey: ['products', 'lowStock'],
    queryFn: () => {
      if (!products) return [];
      
      return products
        .filter(product => (
          product.stock > 0 && 
          product.minimumStock !== undefined && 
          product.stock <= product.minimumStock
        ))
        .sort((a, b) => (a.stock / (a.minimumStock || 1)) - (b.stock / (b.minimumStock || 1)));
    },
    enabled: !isLoading && !!products,
  });
}

// Type for top selling product
interface TopSellingProduct {
  id: string;
  name: string;
  salesCount: number;
  revenue: number;
}

// Type for sales summary
interface SalesSummaryItem {
  totalSales: number;
  totalItems: number;
  totalCustomers: number;
}

interface SalesSummary {
  today: SalesSummaryItem;
  yesterday: SalesSummaryItem;
  monthlyData: MonthlyData[];
}

interface MonthlyData {
  month: string;
  sales: number;
}

// Mock function to get the sales data from localStorage
// In a real application, this would come from a backend API
function getSalesFromStorage(): Sale[] {
  const sales = storageService.getItem<Sale[]>(STORAGE_KEYS.ORDERS) || [];
  return sales;
}

// Mock function to get the top selling products
export function useTopSellingProducts() {
  const { data: products } = useProducts();
  
  return useQuery({
    queryKey: ['products', 'topSelling'],
    queryFn: () => {
      // Get sales data from localStorage
      const sales = getSalesFromStorage();
      
      if (!products || products.length === 0 || !sales || sales.length === 0) {
        return [] as TopSellingProduct[];
      }
      
      // Create a map to hold product sales data
      const productSales = new Map<string, TopSellingProduct>();
      
      // Calculate product sales
      sales.forEach(sale => {
        if (!sale.items) return;
        
        sale.items.forEach(item => {
          // Make sure we have the product ID
          const productId = item.product?.id || item.id;
          if (!productId) return;
          
          if (!productSales.has(productId)) {
            productSales.set(productId, {
              id: productId,
              name: item.product?.name || item.name || 'Unknown Product',
              salesCount: 0,
              revenue: 0,
            });
          }
          
          const productData = productSales.get(productId)!;
          productData.salesCount += item.quantity;
          productData.revenue += item.price * item.quantity;
          
          productSales.set(productId, productData);
        });
      });
      
      // Convert to array and sort by sales count
      return Array.from(productSales.values())
        .sort((a, b) => b.salesCount - a.salesCount || b.revenue - a.revenue)
        .slice(0, 5);
    },
    enabled: !!products,
  });
}

// Helper to get products
function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const products = storageService.getItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
      return products;
    },
  });
}

// Get sales summary data by day, month, year
export function useSalesSummary() {
  return useQuery<SalesSummary>({
    queryKey: ['sales', 'summary'],
    queryFn: () => {
      const sales = getSalesFromStorage();
      
      if (!sales || sales.length === 0) {
        return {
          today: { totalSales: 0, totalItems: 0, totalCustomers: 0 },
          yesterday: { totalSales: 0, totalItems: 0, totalCustomers: 0 },
          monthlyData: generateDefaultMonthlyData(),
        };
      }
      
      // Calculate today and yesterday dates
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      
      // Initialize summary objects
      const todaySummary: SalesSummaryItem = { totalSales: 0, totalItems: 0, totalCustomers: 0 };
      const yesterdaySummary: SalesSummaryItem = { totalSales: 0, totalItems: 0, totalCustomers: 0 };
      
      // Track unique customers
      const todayCustomers = new Set<string>();
      const yesterdayCustomers = new Set<string>();
      
      // Process sales
      sales.forEach(sale => {
        const saleDate = new Date(sale.createdAt).getTime();
        const isToday = saleDate >= today && saleDate < today + 86400000;
        const isYesterday = saleDate >= yesterday && saleDate < yesterday + 86400000;
        
        if (isToday) {
          todaySummary.totalSales += sale.finalTotal || 0;
          todaySummary.totalItems += sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          
          if (sale.customer?.id) {
            todayCustomers.add(sale.customer.id);
          }
        } else if (isYesterday) {
          yesterdaySummary.totalSales += sale.finalTotal || 0;
          yesterdaySummary.totalItems += sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          
          if (sale.customer?.id) {
            yesterdayCustomers.add(sale.customer.id);
          }
        }
      });
      
      // Update customer counts
      todaySummary.totalCustomers = todayCustomers.size;
      yesterdaySummary.totalCustomers = yesterdayCustomers.size;
      
      // Calculate monthly data (last 6 months)
      const monthlyData = calculateMonthlyData(sales);
      
      return {
        today: todaySummary,
        yesterday: yesterdaySummary,
        monthlyData,
      };
    },
  });
}

// Generate default monthly data when no sales exist
function generateDefaultMonthlyData(): MonthlyData[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  
  // Get the last 6 months
  const lastSixMonths: MonthlyData[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    lastSixMonths.push({
      month: months[monthIndex],
      sales: 0
    });
  }
  
  return lastSixMonths;
}

// Calculate monthly sales data
function calculateMonthlyData(sales: Sale[]): MonthlyData[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Initialize monthly data for the last 6 months
  const monthlyData = generateDefaultMonthlyData();
  
  // Process sales for monthly data
  sales.forEach(sale => {
    const saleDate = new Date(sale.createdAt);
    const saleMonth = saleDate.getMonth();
    const saleYear = saleDate.getFullYear();
    
    // Check if the sale is from the last 6 months
    for (let i = 0; i < 6; i++) {
      const targetMonth = (currentMonth - i + 12) % 12;
      const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      if (saleMonth === targetMonth && saleYear === targetYear) {
        // Find the corresponding month in our data array
        const monthIndex = monthlyData.findIndex(item => item.month === months[targetMonth]);
        if (monthIndex !== -1) {
          monthlyData[monthIndex].sales += sale.finalTotal || 0;
        }
        break;
      }
    }
  });
  
  return monthlyData;
}
