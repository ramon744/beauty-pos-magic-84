
import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

interface DiscountsListProps {
  isOpen: boolean;
  onClose: () => void;
  manualDiscount: { type: 'percentage' | 'fixed'; value: number } | null;
  appliedPromotion: AppliedPromotion | null;
  promotions: Promotion[];
  onRemoveManualDiscount: () => void;
  onRemovePromotion: () => void;
  onDeleteDiscount: (discountType: 'manual' | 'promotion', reason?: string) => void;
  onRequestAuth: (action: () => void) => void;
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
  onRequestAuth,
}: DiscountsListProps) => {
  const { toast } = useToast();
  const [discountReason, setDiscountReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [discountTypeToDelete, setDiscountTypeToDelete] = useState<'manual' | 'promotion' | null>(null);

  // Find promotion details safely
  const appliedPromotionDetails = appliedPromotion && promotions
    ? promotions.find(p => p.id === appliedPromotion.promotionId)
    : null;

  const hasDiscounts = Boolean(manualDiscount || appliedPromotion);

  const handleRemoveManualDiscount = () => {
    onRemoveManualDiscount();
    toast({
      title: "Desconto removido",
      description: "Desconto manual removido da venda"
    });
  };

  const handleRemovePromotion = () => {
    onRemovePromotion();
    toast({
      title: "Promoção removida",
      description: "Promoção automática removida da venda"
    });
  };

  const promptForReason = (discountType: 'manual' | 'promotion') => {
    setDiscountTypeToDelete(discountType);
    setShowReasonInput(true);
  };

  const handleDeleteWithReason = () => {
    if (discountTypeToDelete) {
      onRequestAuth(() => {
        onDeleteDiscount(discountTypeToDelete, discountReason);
        setShowReasonInput(false);
        setDiscountReason("");
        setDiscountTypeToDelete(null);
        
        toast({
          title: "Desconto excluído",
          description: discountTypeToDelete === 'manual' 
            ? "Desconto manual excluído da venda" 
            : "Promoção automática excluída da venda"
        });
      });
    }
  };

  const cancelDeleteWithReason = () => {
    setShowReasonInput(false);
    setDiscountReason("");
    setDiscountTypeToDelete(null);
  };

  // Helper function to safely format values
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  };

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

        {showReasonInput ? (
          <div className="py-4">
            <h3 className="text-sm font-medium mb-2">
              Motivo da remoção do desconto:
            </h3>
            <Textarea
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Informe o motivo da remoção do desconto"
              className="mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDeleteWithReason}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteWithReason}
              >
                Confirmar Exclusão
              </Button>
            </div>
          </div>
        ) : (
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
                          ? `${formatValue(manualDiscount.value)}%`
                          : `R$ ${formatValue(manualDiscount.value)}`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={handleRemoveManualDiscount}
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
                      {appliedPromotion && (
                        <span className="text-sm text-muted-foreground">
                          (R$ {formatValue(appliedPromotion.discountAmount)})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={handleRemovePromotion}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {hasDiscounts && !showReasonInput && (
            <Button
              variant="destructive"
              className="sm:mr-auto"
              onClick={() => {
                if (manualDiscount) {
                  promptForReason('manual');
                } else if (appliedPromotion) {
                  promptForReason('promotion');
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}
          {!showReasonInput && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
