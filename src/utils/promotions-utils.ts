
import { Product, Promotion, CartItem } from '@/types';

export type AppliedPromotion = {
  promotionId: string;
  discountAmount: number;
  appliedItems: string[]; // Product IDs
};

export const getAvailablePromotions = (
  cartItems: CartItem[],
  allPromotions: Promotion[]
): Promotion[] => {
  if (!cartItems.length || !allPromotions.length) return [];
  
  const now = new Date();
  
  // Filter only active promotions that are currently valid
  const activePromotions = allPromotions.filter(
    (promo) => promo.isActive && 
               new Date(promo.startDate) <= now && 
               new Date(promo.endDate) >= now
  );

  // Create a set of product IDs in the cart for faster lookup
  const productIdsInCart = new Set(cartItems.map(item => item.product.id));
  
  // Create a map of category IDs in the cart for faster lookup
  const categoryIdsInCart = new Set(cartItems.map(item => item.product.category.id));

  // Find applicable promotions for current cart items
  return activePromotions.filter((promotion) => {
    // For promotions that apply to specific products
    if (promotion.productId) {
      return productIdsInCart.has(promotion.productId);
    }
    
    // For promotions with multiple products
    if (promotion.productIds && promotion.productIds.length > 0) {
      return promotion.productIds.some(id => productIdsInCart.has(id));
    }
    
    // For promotions that apply to specific categories
    if (promotion.categoryId) {
      return categoryIdsInCart.has(promotion.categoryId);
    }
    
    // Bundle promotions with multiple products
    if (promotion.type === 'bundle' && promotion.bundleProducts?.length) {
      // Check if all bundle products are in the cart
      return promotion.bundleProducts.every(id => productIdsInCart.has(id));
    }
    
    // For buy_x_get_y promotions, check both primary and secondary products
    if (promotion.type === 'buy_x_get_y') {
      const hasPrimaryProduct = promotion.productId && productIdsInCart.has(promotion.productId);
      const hasSecondaryProduct = promotion.secondaryProductId && productIdsInCart.has(promotion.secondaryProductId);
      
      // For buy X get Y from the same product type
      if (!promotion.secondaryProductId && promotion.productId) {
        return hasPrimaryProduct;
      }
      
      // For buy X get Y for different products
      return hasPrimaryProduct || hasSecondaryProduct;
    }
    
    return false;
  });
};

export function calculatePromotionDiscount(
  cartItems: CartItem[],
  promotion: Promotion,
  products: Product[]
): AppliedPromotion {
  const appliedItems: string[] = [];
  let discountAmount = 0;
  
  switch (promotion.type) {
    case 'discount_percentage': {
      // Apply percentage discount
      cartItems.forEach(item => {
        const matchesProduct = promotion.productId && item.product.id === promotion.productId;
        const matchesMultipleProducts = promotion.productIds && promotion.productIds.includes(item.product.id);
        const matchesCategory = promotion.categoryId && item.product.category.id === promotion.categoryId;
        
        if (matchesProduct || matchesMultipleProducts || matchesCategory) {
          const itemDiscount = item.price * item.quantity * (promotion.discountPercent || 0) / 100;
          discountAmount += itemDiscount;
          appliedItems.push(item.product.id);
        }
      });
      break;
    }
      
    case 'discount_value': {
      // Apply fixed value discount
      cartItems.forEach(item => {
        const matchesProduct = promotion.productId && item.product.id === promotion.productId;
        const matchesMultipleProducts = promotion.productIds && promotion.productIds.includes(item.product.id);
        const matchesCategory = promotion.categoryId && item.product.category.id === promotion.categoryId;
        
        if (matchesProduct || matchesMultipleProducts || matchesCategory) {
          // For multiple products, distribute the discount proportionally based on item price
          if (matchesMultipleProducts) {
            const relevantItems = cartItems.filter(ci => 
              promotion.productIds?.includes(ci.product.id)
            );
            
            const totalRelevantItemsValue = relevantItems.reduce(
              (sum, ci) => sum + (ci.price * ci.quantity), 0
            );
            
            // Calculate proportional discount for this item
            const itemProportion = (item.price * item.quantity) / totalRelevantItemsValue;
            const itemDiscount = itemProportion * (promotion.discountValue || 0);
            
            discountAmount += itemDiscount;
            appliedItems.push(item.product.id);
          } else {
            // For single product or category, use original logic
            const itemDiscount = Math.min(
              item.price * item.quantity,
              (promotion.discountValue || 0) * (item.quantity / cartItems.reduce(
                (total, i) => {
                  const itemMatches = 
                    (matchesProduct && i.product.id === item.product.id) ||
                    (matchesCategory && i.product.category.id === item.product.category.id);
                  
                  return itemMatches ? total + i.quantity : total;
                }, 0
              ))
            );
            discountAmount += itemDiscount;
            appliedItems.push(item.product.id);
          }
        }
      });
      break;
    }
      
    case 'fixed_price': {
      // Apply fixed price
      cartItems.forEach(item => {
        const matchesProduct = promotion.productId && item.product.id === promotion.productId;
        const matchesMultipleProducts = promotion.productIds && promotion.productIds.includes(item.product.id);
        
        if (matchesProduct || matchesMultipleProducts) {
          const normalPrice = item.price * item.quantity;
          const discountedPrice = (promotion.fixedPrice || 0) * item.quantity;
          discountAmount += normalPrice - discountedPrice;
          appliedItems.push(item.product.id);
        }
      });
      break;
    }
      
    case 'buy_x_get_y': {
      // Handle "buy X get Y" promotion
      if (!promotion.productId && (!promotion.productIds || !promotion.productIds.length)) break;
      
      let eligibleItems = [];
      
      if (promotion.productId) {
        eligibleItems = cartItems.filter(item => item.product.id === promotion.productId);
      } else if (promotion.productIds) {
        eligibleItems = cartItems.filter(item => promotion.productIds?.includes(item.product.id));
      }
      
      // Calculate how many sets of "buy X" are in the cart
      const buyQuantity = promotion.buyQuantity || 1;
      const getQuantity = promotion.getQuantity || 1;
      const secondaryProductId = promotion.secondaryProductId || (promotion.productId || promotion.productIds?.[0]);
      const secondaryDiscount = promotion.secondaryProductDiscount || 100; // Default to 100% (free)
      
      let totalEligibleQuantity = eligibleItems.reduce(
        (sum, item) => sum + item.quantity, 0
      );
      
      // If there's a secondary product
      if (secondaryProductId !== promotion.productId && (!promotion.productIds || !promotion.productIds.includes(secondaryProductId))) {
        const secondaryItems = cartItems.filter(
          item => item.product.id === secondaryProductId
        );
        const secondaryQuantity = secondaryItems.reduce(
          (sum, item) => sum + item.quantity, 0
        );
        
        // Calculate how many complete sets we have
        const sets = Math.min(
          Math.floor(totalEligibleQuantity / buyQuantity),
          Math.floor(secondaryQuantity / getQuantity)
        );
        
        if (sets > 0) {
          // Calculate discount for secondary product
          const secondaryItem = secondaryItems[0];
          if (secondaryItem) {
            const discountPerItem = secondaryItem.price * (secondaryDiscount / 100);
            discountAmount += discountPerItem * getQuantity * sets;
            appliedItems.push(secondaryProductId);
          }
        }
      } else {
        // If buying and getting the same product
        // For every X+Y items, we apply discount to Y items
        const sets = Math.floor(totalEligibleQuantity / (buyQuantity + getQuantity));
        
        if (sets > 0) {
          const item = eligibleItems[0];
          const discountPerItem = item.price * (secondaryDiscount / 100);
          discountAmount += discountPerItem * getQuantity * sets;
          appliedItems.push(item.product.id);
        }
      }
      break;
    }
      
    case 'bundle': {
      // Handle bundle promotion
      if (!promotion.bundleProducts?.length || !promotion.bundlePrice) break;
      
      // Check if all bundle products are in the cart
      const bundleProductsInCart = promotion.bundleProducts.every(
        productId => cartItems.some(item => item.product.id === productId)
      );
      
      if (bundleProductsInCart) {
        // Calculate how many complete bundles we can make
        const bundleItems = cartItems.filter(
          item => promotion.bundleProducts?.includes(item.product.id)
        );
        
        // Calculate total price of bundle products (for 1 set)
        const bundleNormalPrice = bundleItems.reduce(
          (sum, item) => sum + (item.price * 1), 0
        );
        
        // Calculate discount
        const bundleDiscount = bundleNormalPrice - (promotion.bundlePrice || 0);
        discountAmount += bundleDiscount;
        appliedItems.push(...bundleItems.map(item => item.product.id));
      }
      break;
    }
  }
  
  // Apply maximum discount per purchase if set
  if (promotion.maxDiscountPerPurchase && discountAmount > promotion.maxDiscountPerPurchase) {
    discountAmount = promotion.maxDiscountPerPurchase;
  }
  
  // Ensure discountAmount is a valid number to prevent toFixed errors
  if (isNaN(discountAmount)) {
    discountAmount = 0;
  }
  
  return {
    promotionId: promotion.id,
    discountAmount,
    appliedItems
  };
}

export function getBestPromotion(
  cartItems: CartItem[],
  availablePromotions: Promotion[],
  products: Product[]
): AppliedPromotion | null {
  if (!availablePromotions.length) return null;
  
  const calculatedPromotions = availablePromotions.map(promotion => 
    calculatePromotionDiscount(cartItems, promotion, products)
  );
  
  // Sort by discount amount (highest first)
  calculatedPromotions.sort((a, b) => b.discountAmount - a.discountAmount);
  
  return calculatedPromotions[0];
}

export function formatPromotionBadge(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 promoção disponível";
  return `${count} promoções disponíveis`;
}
