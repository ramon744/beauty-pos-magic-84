
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, ArrowUpRight, ArrowDownLeft, Eye } from 'lucide-react';
import { useCashier } from '@/hooks/use-cashier';
import { Cashier } from '@/types';
import OpenCashierDialog from '@/components/cashiers/OpenCashierDialog';
import CloseCashierDialog from '@/components/cashiers/CloseCashierDialog';
import CashierDetailsDialog from '@/components/cashiers/CashierDetailsDialog';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const CashiersPage = () => {
  const [activeTab, setActiveTab] = useState('open');
  const [openOpenDialog, setOpenOpenDialog] = useState(false);
  const [openCloseDialog, setOpenCloseDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  
  // Valores dos formulários de operações
  const [selectedCashierId, setSelectedCashierId] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReason, setDepositReason] = useState('');
  
  const { 
    openCashiers, 
    closedCashiers,
    loading,
    filters, 
    setFilters,
    performOperation,
    formatDateTime,
    formatCurrency 
  } = useCashier();
  
  const { hasPermission } = useAuth();
  
  // Manipular visualização de detalhes
  const handleViewDetails = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setOpenDetailsDialog(true);
  };
  
  // Manipular fechamento de caixa
  const handleCloseCashier = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setOpenCloseDialog(true);
  };
  
  // Manipular sangria de caixa
  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCashierId || !withdrawalAmount || !withdrawalReason) return;
    
    const amount = parseFloat(withdrawalAmount.replace(',', '.'));
    
    const success = performOperation(
      selectedCashierId, 
      'withdrawal', 
      amount, 
      withdrawalReason
    );
    
    if (success) {
      // Limpar formulário
      setWithdrawalAmount('');
      setWithdrawalReason('');
    }
  };
  
  // Manipular suprimento de caixa
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCashierId || !depositAmount || !depositReason) return;
    
    const amount = parseFloat(depositAmount.replace(',', '.'));
    
    const success = performOperation(
      selectedCashierId, 
      'deposit', 
      amount, 
      depositReason
    );
    
    if (success) {
      // Limpar formulário
      setDepositAmount('');
      setDepositReason('');
    }
  };
  
  return (
    <div className="container p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Controle de Caixa</h1>
        <p className="text-muted-foreground">
          Gerencie abertura, fechamento e movimentações de caixa dos funcionários.
        </p>
      </div>

      <Tabs defaultValue="open" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md">
          <TabsTrigger value="open">Abertos</TabsTrigger>
          <TabsTrigger value="closed">Fechados</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="open" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Caixas Abertos</h2>
            {hasPermission(['admin', 'manager']) && (
              <Button onClick={() => setOpenOpenDialog(true)}>Abrir Novo Caixa</Button>
            )}
          </div>
          
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <p className="text-center py-4">Carregando...</p>
              ) : openCashiers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Caixa</TableHead>
                      <TableHead>Abertura</TableHead>
                      <TableHead>Valor Inicial</TableHead>
                      <TableHead>Valor Atual</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openCashiers.map((cashier) => (
                      <TableRow key={cashier.id}>
                        <TableCell>{cashier.employeeName}</TableCell>
                        <TableCell>{cashier.registerNumber}</TableCell>
                        <TableCell>{formatDateTime(cashier.openedAt)}</TableCell>
                        <TableCell>{formatCurrency(cashier.initialAmount)}</TableCell>
                        <TableCell>{formatCurrency(cashier.currentAmount)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(cashier)}>
                              <Eye size={16} className="mr-1" /> Detalhes
                            </Button>
                            {hasPermission(['admin', 'manager']) && (
                              <Button variant="default" size="sm" onClick={() => handleCloseCashier(cashier)}>
                                Fechar Caixa
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  Nenhum caixa aberto. Clique em "Abrir Novo Caixa" para começar.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="closed" className="space-y-4">
          <h2 className="text-xl font-semibold">Caixas Fechados</h2>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="date-from">Data Inicial</Label>
              <Input 
                type="date" 
                id="date-from" 
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="date-to">Data Final</Label>
              <Input 
                type="date" 
                id="date-to" 
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="employee">Funcionário</Label>
              <Select 
                value={filters.employeeId}
                onValueChange={(value) => setFilters({...filters, employeeId: value})}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {/* Dados dinâmicos de funcionários viriam aqui */}
                  <SelectItem value="1">Maria Silva</SelectItem>
                  <SelectItem value="2">João Oliveira</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {loading ? (
                <p className="text-center py-4">Carregando...</p>
              ) : closedCashiers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Caixa</TableHead>
                      <TableHead>Abertura</TableHead>
                      <TableHead>Fechamento</TableHead>
                      <TableHead>Valor Inicial</TableHead>
                      <TableHead>Valor Final</TableHead>
                      <TableHead>Diferença</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedCashiers.map((cashier) => (
                      <TableRow key={cashier.id}>
                        <TableCell>{cashier.employeeName}</TableCell>
                        <TableCell>{cashier.registerNumber}</TableCell>
                        <TableCell>{formatDateTime(cashier.openedAt)}</TableCell>
                        <TableCell>{formatDateTime(cashier.closedAt)}</TableCell>
                        <TableCell>{formatCurrency(cashier.initialAmount)}</TableCell>
                        <TableCell>{formatCurrency(cashier.currentAmount)}</TableCell>
                        <TableCell className={cashier.difference !== 0 ? 'text-red-500' : ''}>
                          {cashier.difference !== undefined ? formatCurrency(cashier.difference) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(cashier)}>
                            <Eye size={16} className="mr-1" /> Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  Nenhum caixa fechado encontrado.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="operations" className="space-y-4">
          <h2 className="text-xl font-semibold">Operações de Caixa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="text-red-500" />
                  Sangria de Caixa
                </CardTitle>
                <CardDescription>
                  Registre a retirada de valores do caixa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleWithdrawal}>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cashier-out">Caixa</Label>
                    <Select
                      value={selectedCashierId}
                      onValueChange={setSelectedCashierId}
                      disabled={openCashiers.length === 0}
                    >
                      <SelectTrigger id="cashier-out">
                        <SelectValue placeholder="Selecione um caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {openCashiers.map((cashier) => (
                          <SelectItem key={cashier.id} value={cashier.id}>
                            {cashier.registerNumber} - {cashier.employeeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="value-out">Valor</Label>
                    <Input 
                      type="text" 
                      id="value-out" 
                      placeholder="0,00" 
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="reason-out">Motivo</Label>
                    <Input 
                      type="text" 
                      id="reason-out" 
                      placeholder="Motivo da retirada"
                      value={withdrawalReason}
                      onChange={(e) => setWithdrawalReason(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    type="submit" 
                    disabled={
                      !selectedCashierId || 
                      !withdrawalAmount || 
                      !withdrawalReason || 
                      openCashiers.length === 0
                    }
                  >
                    Confirmar Sangria
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownLeft className="text-green-500" />
                  Suprimento de Caixa
                </CardTitle>
                <CardDescription>
                  Registre a entrada de valores no caixa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleDeposit}>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cashier-in">Caixa</Label>
                    <Select
                      value={selectedCashierId}
                      onValueChange={setSelectedCashierId}
                      disabled={openCashiers.length === 0}
                    >
                      <SelectTrigger id="cashier-in">
                        <SelectValue placeholder="Selecione um caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {openCashiers.map((cashier) => (
                          <SelectItem key={cashier.id} value={cashier.id}>
                            {cashier.registerNumber} - {cashier.employeeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="value-in">Valor</Label>
                    <Input 
                      type="text" 
                      id="value-in" 
                      placeholder="0,00" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="reason-in">Motivo</Label>
                    <Input 
                      type="text" 
                      id="reason-in" 
                      placeholder="Motivo da entrada"
                      value={depositReason}
                      onChange={(e) => setDepositReason(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    type="submit"
                    disabled={
                      !selectedCashierId || 
                      !depositAmount || 
                      !depositReason || 
                      openCashiers.length === 0
                    }
                  >
                    Confirmar Suprimento
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <OpenCashierDialog 
        open={openOpenDialog} 
        onOpenChange={setOpenOpenDialog} 
      />
      
      <CloseCashierDialog 
        open={openCloseDialog} 
        onOpenChange={setOpenCloseDialog} 
        cashier={selectedCashier}
      />
      
      <CashierDetailsDialog 
        open={openDetailsDialog} 
        onOpenChange={setOpenDetailsDialog} 
        cashier={selectedCashier}
      />
    </div>
  );
};

export default CashiersPage;
