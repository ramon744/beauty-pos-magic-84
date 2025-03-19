import { supabase } from '@/integrations/supabase/client';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { fromTable } from './supabase-helper';

// This service helps migrate data from localStorage to Supabase
// while maintaining backward compatibility
export const migrationService = {
  // Products
  async migrateProducts() {
    const localProducts = storageService.getItem(STORAGE_KEYS.PRODUCTS);
    if (!localProducts) return;
    
    // Ensure we have an array of products
    const products = Array.isArray(localProducts) ? localProducts : [];
    
    // Insert products into Supabase
    for (const product of products) {
      const productData = {
        id: product.id,
        name: product.name,
        description: product.description,
        code: product.code,
        category_id: product.category?.id,
        sale_price: product.salePrice,
        cost_price: product.costPrice,
        stock: product.stock,
        minimum_stock: product.minimumStock,
        created_at: product.createdAt,
        updated_at: product.updatedAt
      };

      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('products').upsert(productData);
        
        if (error) console.error('Error migrating product:', error);
      } catch (err) {
        console.error('Error migrating product:', err);
      }
    }
  },

  // Categories
  async migrateCategories() {
    const localCategories = storageService.getItem(STORAGE_KEYS.CATEGORIES);
    if (!localCategories) return;
    
    // Ensure we have an array of categories
    const categories = Array.isArray(localCategories) ? localCategories : [];

    // Insert categories into Supabase
    for (const category of categories) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('categories').upsert({
          id: category.id,
          name: category.name
        });
        
        if (error) console.error('Error migrating category:', error);
      } catch (err) {
        console.error('Error migrating category:', err);
      }
    }
  },

  // Customers
  async migrateCustomers() {
    const localCustomers = storageService.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!localCustomers) return;
    
    // Ensure we have an array of customers
    const customers = Array.isArray(localCustomers) ? localCustomers : [];

    // Insert customers into Supabase
    for (const customer of customers) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('customers').upsert({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          created_at: customer.createdAt,
          updated_at: customer.updatedAt
        });
        
        if (error) console.error('Error migrating customer:', error);
      } catch (err) {
        console.error('Error migrating customer:', err);
      }
    }
  },

  // Users
  async migrateUsers() {
    const localUsers = storageService.getItem(STORAGE_KEYS.USERS);
    if (!localUsers) return;
    
    // Ensure we have an array of users
    const users = Array.isArray(localUsers) ? localUsers : [];

    // Insert users into Supabase
    for (const user of users) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('users').upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          assigned_cashier_id: user.assignedCashierId,
          created_at: user.createdAt
        });
        
        if (error) console.error('Error migrating user:', error);
      } catch (err) {
        console.error('Error migrating user:', err);
      }
    }
  },

  // Cashiers
  async migrateCashiers() {
    const localCashiers = storageService.getItem(STORAGE_KEYS.CASHIERS);
    if (!localCashiers) return;
    
    // Ensure we have an array of cashiers
    const cashiers = Array.isArray(localCashiers) ? localCashiers : [];

    // Insert cashiers into Supabase
    for (const cashier of cashiers) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('cashiers').upsert({
          id: cashier.id,
          name: cashier.name,
          register_number: cashier.registerNumber,
          location: cashier.location,
          is_active: cashier.isActive,
          assigned_user_id: cashier.assignedUserId,
          assigned_user_name: cashier.assignedUserName,
          created_at: cashier.createdAt,
          updated_at: cashier.updatedAt
        });
        
        if (error) console.error('Error migrating cashier:', error);
      } catch (err) {
        console.error('Error migrating cashier:', err);
      }
    }
  },

  // Cashier Operations
  async migrateCashierOperations() {
    const localOperations = storageService.getItem(STORAGE_KEYS.CASHIER_OPERATIONS);
    if (!localOperations) return;
    
    // Ensure we have an array of operations
    const operations = Array.isArray(localOperations) ? localOperations : [];

    // Insert operations into Supabase
    for (const operation of operations) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('cashier_operations').upsert({
          id: operation.id,
          cashier_id: operation.cashierId,
          user_id: operation.userId,
          user_name: operation.userName,
          operation_type: operation.operationType,
          amount: operation.amount,
          reason: operation.reason,
          manager_id: operation.managerId,
          manager_name: operation.managerName,
          timestamp: operation.timestamp
        });
        
        if (error) console.error('Error migrating cashier operation:', error);
      } catch (err) {
        console.error('Error migrating cashier operation:', err);
      }
    }
  },

  // Orders
  async migrateOrders() {
    const localOrders = storageService.getItem(STORAGE_KEYS.SALES);
    if (!localOrders) return;
    
    // Ensure we have an array of orders
    const orders = Array.isArray(localOrders) ? localOrders : [];

    // Insert orders into Supabase
    for (const order of orders) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('orders').upsert({
          id: order.id,
          user_id: order.userId || '1',
          cashier_id: order.cashierId,
          customer_id: order.customerId,
          subtotal: order.subtotal,
          discount_amount: order.discountAmount,
          final_total: order.finalTotal,
          payment_method: order.paymentMethod,
          payment_details: order.paymentDetails,
          created_at: order.createdAt
        });
        
        if (error) console.error('Error migrating order:', error);
        
        // Insert order items
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            try {
              // Use our helper function to safely access Supabase tables
              const { error: itemError } = await fromTable('order_items').upsert({
                id: item.id || crypto.randomUUID(),
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
              });
              
              if (itemError) console.error('Error migrating order item:', itemError);
            } catch (err) {
              console.error('Error migrating order item:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error migrating order:', err);
      }
    }
  },

  // Promotions
  async migratePromotions() {
    const localPromotions = storageService.getItem(STORAGE_KEYS.PROMOTIONS);
    if (!localPromotions) return;
    
    // Ensure we have an array of promotions
    const promotions = Array.isArray(localPromotions) ? localPromotions : [];

    // Insert promotions into Supabase
    for (const promotion of promotions) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('promotions').upsert({
          id: promotion.id,
          name: promotion.name,
          type: promotion.type,
          description: promotion.description,
          discount_percent: promotion.discountPercent,
          fixed_price: promotion.fixedPrice,
          buy_quantity: promotion.buyQuantity,
          get_quantity: promotion.getQuantity,
          product_id: promotion.productId,
          secondary_product_id: promotion.secondaryProductId,
          secondary_product_discount: promotion.secondaryProductDiscount,
          category_id: promotion.categoryId,
          product_ids: promotion.productIds,
          bundle_products: promotion.bundleProducts,
          start_date: promotion.startDate,
          end_date: promotion.endDate,
          is_active: promotion.isActive,
          created_by: promotion.createdBy,
          created_at: promotion.createdAt
        });
        
        if (error) console.error('Error migrating promotion:', error);
      } catch (err) {
        console.error('Error migrating promotion:', err);
      }
    }
  },

  // Suppliers
  async migrateSuppliers() {
    const localSuppliers = storageService.getItem(SUPPLIERS_STORAGE_KEY);
    if (!localSuppliers) return;
    
    // Ensure we have an array of suppliers
    const suppliers = Array.isArray(localSuppliers) ? localSuppliers : [];

    // Insert suppliers into Supabase
    for (const supplier of suppliers) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('suppliers').upsert({
          id: supplier.id,
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          contact_person: supplier.contactPerson,
          cnpj: supplier.cnpj,
          created_at: supplier.createdAt,
          updated_at: supplier.updatedAt
        });
        
        if (error) console.error('Error migrating supplier:', error);
      } catch (err) {
        console.error('Error migrating supplier:', err);
      }
    }
  },

  // Stock History
  async migrateStockHistory() {
    const localStockHistory = storageService.getItem(STORAGE_KEYS.STOCKS);
    if (!localStockHistory) return;
    
    // Ensure we have an array of stock history
    const stockHistory = Array.isArray(localStockHistory) ? localStockHistory : [];

    // Insert stock history into Supabase
    for (const record of stockHistory) {
      try {
        // Use our helper function to safely access Supabase tables
        const { error } = await fromTable('stock_history').upsert({
          id: record.id,
          product_id: record.productId,
          date: record.date,
          quantity: record.quantity,
          type: record.type,
          reason: record.reason,
          user_id: record.userId
        });
        
        if (error) console.error('Error migrating stock history:', error);
      } catch (err) {
        console.error('Error migrating stock history:', err);
      }
    }
  },

  // Run all migrations
  async migrateAll() {
    console.log('Starting migration from localStorage to Supabase...');
    
    // Migrate in dependency order
    await this.migrateCategories();
    await this.migrateProducts();
    await this.migrateCustomers();
    await this.migrateUsers();
    await this.migrateCashiers();
    await this.migrateCashierOperations();
    await this.migrateOrders();
    await this.migratePromotions();
    await this.migrateSuppliers();
    await this.migrateStockHistory();
    
    console.log('Migration completed!');
    return true;
  }
};

// For suppliers that might be using a different storage key
const SUPPLIERS_STORAGE_KEY = 'suppliers';
