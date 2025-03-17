
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Promotion, Product } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Check, Tag, Percent, ShoppingBag, Gift } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PromotionSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promotions: Promotion[];
  selectedPromotionId: string | null;
  onSelectPromotion: (promotionId: string | null) => void;
  products: Product[];
}

export const PromotionSelectionDialog = ({
  isOpen,
  onClose,
  promotions,
  selectedPromotionId,
  onSelectPromotion,
  products,
}: PromotionSelectionDialogProps) => {
  if (!promotions.length) return null;

  const getPromotionDetails = (promotion: Promotion): string => {
    const getProductName = (productId?: string) => {
      if (!productId) return "todos os produtos";
      const product = products.find((p) => p.id === productId);
      return product ? product.name : "produto não encontrado";
    };

    switch (promotion.type) {
      case "discount_percentage":
        return `${promotion.discountPercent}% de desconto em ${getProductName(promotion.productId)}`;
      case "discount_value":
        return `${formatCurrency(promotion.discountValue || 0)} de desconto em ${getProductName(promotion.productId)}`;
      case "buy_x_get_y": {
        const mainProduct = getProductName(promotion.productId);
        const secondaryProduct = promotion.secondaryProductId
          ? getProductName(promotion.secondaryProductId)
          : mainProduct;
        const discountText =
          (promotion.secondaryProductDiscount || 0) < 100
            ? `com ${promotion.secondaryProductDiscount}% de desconto`
            : "grátis";

        return `Compre ${promotion.buyQuantity} ${mainProduct} e leve ${promotion.getQuantity} ${secondaryProduct} ${discountText}`;
      }
      case "fixed_price":
        return `Preço fixo de ${formatCurrency(promotion.fixedPrice || 0)} para ${getProductName(promotion.productId)}`;
      case "bundle":
        return `Pacote de produtos por ${formatCurrency(promotion.bundlePrice || 0)}`;
      default:
        return promotion.description;
    }
  };

  const getPromotionIcon = (type: Promotion["type"]) => {
    switch (type) {
      case "discount_percentage":
        return <Percent className="h-6 w-6 text-green-500" />;
      case "discount_value":
        return <Tag className="h-6 w-6 text-blue-500" />;
      case "buy_x_get_y":
        return <Gift className="h-6 w-6 text-purple-500" />;
      case "fixed_price":
        return <Tag className="h-6 w-6 text-amber-500" />;
      case "bundle":
        return <ShoppingBag className="h-6 w-6 text-indigo-500" />;
      default:
        return <Percent className="h-6 w-6 text-green-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Promoções Disponíveis
          </DialogTitle>
          <DialogDescription>
            Selecione uma das promoções disponíveis para os produtos no seu carrinho
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup
            value={selectedPromotionId || "none"}
            onValueChange={(value) => onSelectPromotion(value === "none" ? null : value)}
            className="space-y-3"
          >
            {promotions.map((promotion) => (
              <div
                key={promotion.id}
                className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
                onClick={() => onSelectPromotion(promotion.id)}
              >
                <RadioGroupItem value={promotion.id} id={promotion.id} className="mt-1" />
                <div className="flex flex-1 items-start space-x-3">
                  {getPromotionIcon(promotion.type)}
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={promotion.id}
                      className="text-base font-medium leading-none cursor-pointer"
                    >
                      {promotion.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {getPromotionDetails(promotion)}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Válido até {formatDate(new Date(promotion.endDate))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div
              className="flex items-start space-x-3 rounded-md border p-3 hover:bg-muted/50 cursor-pointer"
              onClick={() => onSelectPromotion(null)}
            >
              <RadioGroupItem value="none" id="none" className="mt-1" />
              <div className="flex flex-1 items-start space-x-3">
                <div className="border rounded-full p-1">
                  <Check className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor="none"
                    className="text-base font-medium leading-none cursor-pointer"
                  >
                    Sem promoção
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Não aplicar nenhuma promoção automaticamente
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={onClose}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
