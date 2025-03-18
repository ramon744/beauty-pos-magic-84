
import React from 'react';
import { ShoppingCart, Users, PercentCircle, ListChecks, Banknote, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSalesManager } from '@/hooks/use-sales-manager';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { useCashier } from '@/hooks/use-cashier';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Export as a named export to match import in Sales.tsx
export const SalesHeader = ({ user }) => {
  const { 
    cart, 
    cartTotal,
    totalDiscountAmount,
    handleClearCart,
    handleAddDiscount,
    handleOpenPromotions,
    handleShowDiscountsList,
    finalizeSale,
    linkCustomer
  } = useSalesManager();
  
  const { openCashiers, openCashier } = useCashier();
  const [showCashierDialog, setShowCashierDialog] = useState(false);
  const [initialAmount, setInitialAmount] = useState<string>('200.00');
  const [registerNumber, setRegisterNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Verificar se o usuário precisa abrir caixa
    if (user?.cashierLinked) {
      const userHasOpenCashier = openCashiers.some(
        cashier => cashier.employeeId === user.id
      );
      
      if (!userHasOpenCashier) {
        setShowCashierDialog(true);
        if (user) {
          setRegisterNumber(`Caixa ${user.name.split(' ')[0]}`);
        }
      }
    }
  }, [user, openCashiers]);
  
  const handleOpenCashier = async () => {
    setLoading(true);
    try {
      // Validar campos
      if (!initialAmount || !registerNumber) {
        console.error('Todos os campos são obrigatórios');
        return;
      }
      
      // Converter para número
      const amountValue = parseFloat(initialAmount.replace(',', '.'));
      
      // Abrir caixa
      if (!user) {
        console.error('Usuário não encontrado');
        return;
      }
      
      const result = openCashier(amountValue, registerNumber);
      
      if (result) {
        // Fechar diálogo
        setShowCashierDialog(false);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 mb-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">
          Ponto de Venda
        </h2>
        <p className="text-muted-foreground">
          Gerencie vendas, clientes e aplique descontos
        </p>
      </div>
      
      <div className="flex gap-1.5">
        <Button 
          onClick={finalizeSale} 
          disabled={cart.length === 0 || (user?.cashierLinked && !openCashiers.some(c => c.employeeId === user?.id))}
          variant="default"
          size="sm"
        >
          <Banknote className="mr-1.5 h-4 w-4" />
          Finalizar
        </Button>
      
        <Button 
          onClick={() => linkCustomer(null)} 
          variant="outline"
          size="sm"
        >
          <Users className="mr-1.5 h-4 w-4" />
          Cliente
        </Button>
        
        <Button 
          onClick={handleAddDiscount} 
          variant="outline"
          size="sm"
        >
          <PercentCircle className="mr-1.5 h-4 w-4" />
          Desconto
        </Button>
        
        <Button 
          onClick={handleOpenPromotions} 
          variant="outline"
          size="sm"
        >
          <ListChecks className="mr-1.5 h-4 w-4" />
          Promoções
        </Button>
        
        {totalDiscountAmount > 0 && (
          <Button 
            onClick={handleShowDiscountsList}
            variant="outline" 
            size="sm"
          >
            Ver Descontos
          </Button>
        )}
        
        <Button 
          onClick={handleClearCart} 
          variant="destructive"
          size="sm"
          disabled={cart.length === 0}
        >
          <ShoppingCart className="mr-1.5 h-4 w-4" />
          Limpar
        </Button>
      </div>
      
      {/* Diálogo de abertura de caixa */}
      <Dialog open={showCashierDialog} onOpenChange={setShowCashierDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Abrir Caixa Necessário</DialogTitle>
            <DialogDescription>
              Você precisa abrir um caixa antes de realizar vendas.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="register" className="text-right">
                Caixa
              </Label>
              <Input
                id="register"
                placeholder="Ex: Caixa 1"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Valor Inicial
              </Label>
              <Input
                id="amount"
                placeholder="0,00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={handleOpenCashier} disabled={loading}>
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Also keep the default export for backward compatibility
export default SalesHeader;
