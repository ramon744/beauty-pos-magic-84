
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/ui/PageTransition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkIcon, PlusIcon, List, ListChecksIcon, ActivityIcon } from 'lucide-react';
import { CashierForm } from '@/components/cashiers/CashierForm';
import { CashierAssignmentForm } from '@/components/cashiers/CashierAssignmentForm';
import { CashiersList } from '@/components/cashiers/CashiersList';
import { useCashiers } from '@/hooks/use-cashiers';
import { Cashier } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircleIcon } from 'lucide-react';

const CashierLink = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { 
    cashiers, 
    isLoading, 
    error, 
    createCashier, 
    updateCashier, 
    deleteCashier,
    assignCashierToUser,
    unassignCashier,
    getAvailableCashiers
  } = useCashiers();

  const [activeTab, setActiveTab] = useState('list');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'create' | 'edit' | 'assign'>('create');
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'unassigned'>('all');

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !hasPermission(['admin'])) {
      navigate('/dashboard');
    }
  }, [user, hasPermission, navigate]);

  const handleOpenCreateDialog = () => {
    setDialogType('create');
    setSelectedCashier(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (cashier: Cashier) => {
    setDialogType('edit');
    setSelectedCashier(cashier);
    setIsDialogOpen(true);
  };

  const handleOpenAssignDialog = () => {
    setDialogType('assign');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCashier(null);
  };

  const handleCreateCashier = async (data: Omit<Cashier, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createCashier(data);
    handleCloseDialog();
  };

  const handleUpdateCashier = async (data: Omit<Cashier, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedCashier) {
      await updateCashier(selectedCashier.id, data);
      handleCloseDialog();
    }
  };

  const handleDeleteCashier = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este caixa?')) {
      await deleteCashier(id);
    }
  };

  const handleAssignCashier = async (cashierId: string, userId: string, userName: string) => {
    await assignCashierToUser(cashierId, userId, userName);
    handleCloseDialog();
  };

  const handleUnassignCashier = async (id: string) => {
    if (window.confirm('Tem certeza que deseja desvincular este caixa?')) {
      await unassignCashier(id);
    }
  };

  const getFilteredCashiers = () => {
    switch (viewMode) {
      case 'active':
        return cashiers.filter(c => c.isActive && c.assignedUserId);
      case 'unassigned':
        return cashiers.filter(c => !c.assignedUserId);
      default:
        return cashiers;
    }
  };

  const availableCashiers = getAvailableCashiers();
  const filteredCashiers = getFilteredCashiers();
  
  // Contadores para monitoramento
  const activeCashiers = cashiers.filter(c => c.isActive && c.assignedUserId).length;
  const totalCashiers = cashiers.length;
  const unassignedCashiers = cashiers.filter(c => !c.assignedUserId).length;

  return (
    <PageTransition>
      <div className="container py-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight flex items-center">
            <LinkIcon className="mr-2 h-8 w-8" />
            Vincular Caixa
          </h2>
          <p className="text-muted-foreground">
            Gerencie caixas e vinculações com funcionários
          </p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center">
              <List className="mr-2 h-4 w-4" />
              Listagem
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center">
              <ListChecksIcon className="mr-2 h-4 w-4" />
              Vinculações
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center">
              <ActivityIcon className="mr-2 h-4 w-4" />
              Monitoramento
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mb-6 mt-4">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="list" className="space-y-6 bg-background">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button 
                  variant={viewMode === 'all' ? "default" : "outline"} 
                  onClick={() => setViewMode('all')}
                >
                  Todos
                </Button>
                <Button 
                  variant={viewMode === 'active' ? "default" : "outline"} 
                  onClick={() => setViewMode('active')}
                >
                  Ativos
                </Button>
                <Button 
                  variant={viewMode === 'unassigned' ? "default" : "outline"} 
                  onClick={() => setViewMode('unassigned')}
                >
                  Não Vinculados
                </Button>
              </div>
              <Button onClick={handleOpenCreateDialog}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Novo Caixa
              </Button>
            </div>

            <CashiersList
              cashiers={filteredCashiers}
              onEdit={handleOpenEditDialog}
              onDelete={handleDeleteCashier}
              onUnassign={handleUnassignCashier}
            />
          </TabsContent>

          <TabsContent value="assignments" className="bg-background">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Vincular Caixa</CardTitle>
                  <CardDescription>Atribua caixas aos funcionários</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Este módulo permite que administradores vinculem caixas aos funcionários.
                  </p>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleOpenAssignDialog}
                      disabled={availableCashiers.length === 0}
                    >
                      Criar Vinculação
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Caixas</CardTitle>
                  <CardDescription>Gerencie os caixas disponíveis</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Adicione, edite ou remova caixas do sistema.
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab('list')}>Gerenciar</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Monitoramento</CardTitle>
                  <CardDescription>Visualize caixas ativos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Veja todos os caixas ativos e suas vinculações no momento.
                  </p>
                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab('monitoring')}>Ver Caixas</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="bg-background">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-4">Monitoramento de Caixas</h3>
              
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-4xl">{activeCashiers}</CardTitle>
                    <CardDescription>Caixas Ativos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Caixas vinculados e operacionais
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-4xl">{unassignedCashiers}</CardTitle>
                    <CardDescription>Caixas Não Vinculados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Caixas disponíveis para vinculação
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-4xl">{totalCashiers}</CardTitle>
                    <CardDescription>Total de Caixas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Número total de caixas no sistema
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Caixas Ativos</CardTitle>
                <CardDescription>Lista de todos os caixas atualmente vinculados</CardDescription>
              </CardHeader>
              <CardContent>
                <CashiersList
                  cashiers={cashiers.filter(c => c.isActive && c.assignedUserId)}
                  onEdit={handleOpenEditDialog}
                  onDelete={handleDeleteCashier}
                  onUnassign={handleUnassignCashier}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs for create, edit, and assign operations */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] bg-background">
            {dialogType === 'create' && (
              <>
                <DialogHeader>
                  <DialogTitle>Criar Novo Caixa</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para criar um novo caixa.
                  </DialogDescription>
                </DialogHeader>
                <CashierForm
                  onSubmit={handleCreateCashier}
                  onCancel={handleCloseDialog}
                />
              </>
            )}

            {dialogType === 'edit' && selectedCashier && (
              <>
                <DialogHeader>
                  <DialogTitle>Editar Caixa</DialogTitle>
                  <DialogDescription>
                    Altere os detalhes do caixa selecionado.
                  </DialogDescription>
                </DialogHeader>
                <CashierForm
                  initialData={selectedCashier}
                  onSubmit={handleUpdateCashier}
                  onCancel={handleCloseDialog}
                />
              </>
            )}

            {dialogType === 'assign' && (
              <>
                <DialogHeader>
                  <DialogTitle>Vincular Caixa a Funcionário</DialogTitle>
                  <DialogDescription>
                    Selecione um caixa e um funcionário para vinculá-los.
                  </DialogDescription>
                </DialogHeader>
                {availableCashiers.length === 0 ? (
                  <div className="py-4">
                    <Alert>
                      <AlertCircleIcon className="h-4 w-4" />
                      <AlertDescription>
                        Não há caixas disponíveis para vinculação. Crie um novo caixa primeiro.
                      </AlertDescription>
                    </Alert>
                    <div className="flex justify-end mt-4">
                      <Button variant="outline" onClick={handleCloseDialog}>
                        Fechar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CashierAssignmentForm
                    availableCashiers={availableCashiers}
                    onSubmit={handleAssignCashier}
                    onCancel={handleCloseDialog}
                  />
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default CashierLink;
