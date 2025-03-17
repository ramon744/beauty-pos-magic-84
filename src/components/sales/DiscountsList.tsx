
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
import { Percent, Gift, Trash2, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AppliedPromotion } from "@/utils/promotions-utils";
import { Promotion } from "@/types";

interface DiscountsListProps {
  isOpen: boolean;
  onClose: () => void;
  manualDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  appliedPromotion: AppliedPromotion | null;
  promotions: Promotion[];
  onRemoveManualDiscount: () => void;
  onRemovePromotion: () => void;
  onDeleteDiscount: (discountType: 'manual' | 'promotion') => void;
}

export const DiscountsList = ({
  isOpen,
  onClose,
  manualDiscount,
  appliedPromotion,
  promotions,
  onRemoveManualDiscount,
  onRemovePromotion,
  onDeleteDiscount,
}: DiscountsListProps) => {
  const { toast } = useToast();

  // Find promotion details
  const appliedPromotionDetails = appliedPromotion
    ? promotions.find(p => p.id === appliedPromotion.promotionId)
    : null;

  const hasDiscounts = manualDiscount || appliedPromotion;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Descontos Aplicados
          </DialogTitle>
          <DialogDescription>
            Lista de todos os descontos aplicados na venda atual.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!hasDiscounts ? (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum desconto aplicado na venda atual.
            </div>
          ) : (
            <div className="space-y-4">
              {manualDiscount && (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                      <Percent className="h-3 w-3 mr-1" />
                      Manual
                    </Badge>
                    <span className="font-medium">
                      {manualDiscount.type === 'percentage'
                        ? `${manualDiscount.value}%`
                        : `R$ ${manualDiscount.value.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={onRemoveManualDiscount}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {appliedPromotionDetails && (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                      <Gift className="h-3 w-3 mr-1" />
                      Promoção
                    </Badge>
                    <span className="font-medium">{appliedPromotionDetails.name}</span>
                    <span className="text-sm text-muted-foreground">
                      (R$ {appliedPromotion?.discountAmount.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={onRemovePromotion}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {hasDiscounts && (
            <Button
              variant="destructive"
              className="sm:mr-auto"
              onClick={() => {
                if (manualDiscount) {
                  onDeleteDiscount('manual');
                } else if (appliedPromotion) {
                  onDeleteDiscount('promotion');
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Todos
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
