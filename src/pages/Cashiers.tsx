
import React, { useState, useEffect } from 'react';
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
import { useCashiers } from '@/hooks/use-cashiers';
import { useCashierOperations } from '@/hooks/use-cashier-operations';
import { OpenCashierDialog } from '@/components/cashiers/OpenCashierDialog';
import { CloseCashierDialog } from '@/components/cashiers/CloseCashierDialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ManagerAuthDialog } from '@/components/auth/ManagerAuthDialog';

const Cashiers = () => {
  const [activeTab, setActiveTab] = useState('open');
  const { cashiers, isLoading } = useCashiers();
  const { operations, getUserCashierStatus, isCashierOpen, getCashierBalance } = useCashierOperations();
  const { users } = useAuth();
  
  // Dialog states
  const [isOpenCashierDialogOpen, setIsOpenCashierDialogOpen] = useState(false);
  const [isCloseCashierDialogOpen, setIsCloseCashierDialogOpen] = useState(false);
  const [isManagerAuthOpen, setIsManagerAuthOpen] = useState(false);
  const [selectedCashierId, setSelectedCashierId] = useState<string | null>(null);
  
  // Operation states
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositReason, setDepositReason] = useState('');
  const [selectedCashierForOperation, setSelectedCashierForOperation] = useState('');
  
  // Get open cashiers
  const openCashiers = cashiers.filter(cashier => 
    cashier.isActive && isCashierOpen(cashier.id)
  );
  
  // Get closed cashiers (those that have operations but are currently closed)
  const closedCashiers = cashiers.filter(cashier => 
    !isCashierOpen(cashier.id) && operations.some(op => op.cashierId === cashier.id)
  );
  
  const handleOpenCashier = (cashierId: string) => {
    setSelectedCashierId(cashierId);
    setIsOpenCashierDialogOpen(true);
  };
  
  const handleCloseCashier = (cashierId: string) => {
    setSelectedCashierId(cashierId);
    setIsCloseCashierDialogOpen(true);
  };
  
  const handleWithdrawal = () => {
    // To be implemented
    toast.info("Funcionalidade de sangria será implementada em breve");
  };
  
  const handleDeposit = () => {
    // To be implemented
    toast.info("Funcionalidade de suprimento será implementada em breve");
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  const formatDateTime = (date: Date) => {
    return format(new Date(date), "HH:mm - dd/MM/yyyy", { locale: ptBR });
  };
  
  const getAssignedUserName = (userId?: string) => {
    if (!userId) return "Não vinculado";
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Usuário desconhecido";
  };
  
  return (
    <div className="container p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Controle de Caixa</h1>
        <p className="text-muted-foreground">
          Gerencie abertura, fechamento e movimentações de caixa dos funcionários.
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 max-w-md">
          <TabsTrigger value="open">Abertos</TabsTrigger>
          <TabsTrigger value="closed">Fechados</TabsTrigger>
          <TabsTrigger value="operations">Operações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="open" className="space-y-4">
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold">Caixas Abertos</h2>
            <Button onClick={() => setIsOpenCashierDialogOpen(true)}>Abrir Novo Caixa</Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
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
                  {openCashiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Não há caixas abertos no momento
                      </TableCell>
                    </TableRow>
                  ) : (
                    openCashiers.map(cashier => {
                      const latestOperation = operations.filter(op => 
                        op.cashierId === cashier.id && op.operationType === 'open'
                      ).sort((a, b) => 
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                      )[0];
                      
                      const currentBalance = getCashierBalance(cashier.id);
                      
                      return (
                        <TableRow key={cashier.id}>
                          <TableCell>{getAssignedUserName(cashier.assignedUserId)}</TableCell>
                          <TableCell>{cashier.name}</TableCell>
                          <TableCell>
                            {latestOperation ? formatDateTime(latestOperation.timestamp) : "N/A"}
                          </TableCell>
                          <TableCell>
                            {latestOperation ? formatCurrency(latestOperation.amount) : "N/A"}
                          </TableCell>
                          <TableCell>{formatCurrency(currentBalance)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye size={16} className="mr-1" /> Detalhes
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleCloseCashier(cashier.id)}
                              >
                                Fechar Caixa
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="closed" className="space-y-4">
          <h2 className="text-xl font-semibold">Caixas Fechados</h2>
          
          <div className="flex gap-4 mb-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="date-from">Data Inicial</Label>
              <Input type="date" id="date-from" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="date-to">Data Final</Label>
              <Input type="date" id="date-to" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="employee">Funcionário</Label>
              <Select>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button>Filtrar</Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
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
                  {closedCashiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        Não há registros de caixas fechados
                      </TableCell>
                    </TableRow>
                  ) : (
                    closedCashiers.map(cashier => {
                      // To be implemented with actual data
                      return (
                        <TableRow key={cashier.id}>
                          <TableCell>{getAssignedUserName(cashier.assignedUserId)}</TableCell>
                          <TableCell>{cashier.name}</TableCell>
                          <TableCell>09:15 - 11/05/2023</TableCell>
                          <TableCell>18:30 - 11/05/2023</TableCell>
                          <TableCell>R$ 200,00</TableCell>
                          <TableCell>R$ 3.542,75</TableCell>
                          <TableCell>R$ 0,00</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye size={16} className="mr-1" /> Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="operations" className="space-y-4">
          <h2 className="text-xl font-semibold">Operações de Caixa</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpRight className="text-green-500" />
                  Sangria de Caixa
                </CardTitle>
                <CardDescription>
                  Registre a retirada de valores do caixa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cashier-out">Caixa</Label>
                    <Select value={selectedCashierForOperation} onValueChange={setSelectedCashierForOperation}>
                      <SelectTrigger id="cashier-out">
                        <SelectValue placeholder="Selecione um caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {openCashiers.map(cashier => (
                          <SelectItem key={cashier.id} value={cashier.id}>
                            {cashier.name} - {getAssignedUserName(cashier.assignedUserId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="value-out">Valor</Label>
                    <Input 
                      type="number" 
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
                    onClick={handleWithdrawal}
                    disabled={!selectedCashierForOperation || !withdrawalAmount}
                  >
                    Confirmar Sangria
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownLeft className="text-blue-500" />
                  Suprimento de Caixa
                </CardTitle>
                <CardDescription>
                  Registre a entrada de valores no caixa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cashier-in">Caixa</Label>
                    <Select value={selectedCashierForOperation} onValueChange={setSelectedCashierForOperation}>
                      <SelectTrigger id="cashier-in">
                        <SelectValue placeholder="Selecione um caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {openCashiers.map(cashier => (
                          <SelectItem key={cashier.id} value={cashier.id}>
                            {cashier.name} - {getAssignedUserName(cashier.assignedUserId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="value-in">Valor</Label>
                    <Input 
                      type="number" 
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
                    onClick={handleDeposit}
                    disabled={!selectedCashierForOperation || !depositAmount}
                  >
                    Confirmar Suprimento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Dialogs */}
      {selectedCashierId && (
        <>
          <OpenCashierDialog
            isOpen={isOpenCashierDialogOpen}
            onClose={() => {
              setIsOpenCashierDialogOpen(false);
              setSelectedCashierId(null);
            }}
            cashierId={selectedCashierId}
            cashierName={cashiers.find(c => c.id === selectedCashierId)?.name || ""}
            onOpenSuccess={() => {
              setSelectedCashierId(null);
              window.location.reload();
            }}
          />
          
          <CloseCashierDialog
            isOpen={isCloseCashierDialogOpen}
            onClose={() => {
              setIsCloseCashierDialogOpen(false);
              setSelectedCashierId(null);
            }}
            cashierId={selectedCashierId}
            cashierName={cashiers.find(c => c.id === selectedCashierId)?.name || ""}
            currentBalance={getCashierBalance(selectedCashierId)}
            onCloseSuccess={() => {
              setSelectedCashierId(null);
              window.location.reload();
            }}
          />
        </>
      )}
      
      <ManagerAuthDialog
        isOpen={isManagerAuthOpen}
        onClose={() => setIsManagerAuthOpen(false)}
        onConfirm={() => {
          // Handle manager auth confirmation
          setIsManagerAuthOpen(false);
        }}
        title="Autorização Gerencial"
        description="Esta operação requer autorização de um gerente ou administrador."
      />
    </div>
  );
};

export default Cashiers;
