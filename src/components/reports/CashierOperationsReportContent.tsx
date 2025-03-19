
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, isAfter, isBefore, isEqual, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useCashierOperationsReport } from '@/hooks/use-cashier-reports';
import { DateRange } from 'react-day-picker';
import { 
  DownloadIcon, 
  CalendarIcon, 
  UserIcon, 
  AlertCircleIcon, 
  FileIcon, 
  InfoIcon,
  ShieldAlertIcon
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { exportToExcel, exportToPDF } from '@/utils/export-utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CashierOperationsReportContent = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date()
  });
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [reportType, setReportType] = useState<'operations' | 'closings' | 'shortages' | 'sales'>('operations');
  
  const { users } = useAuth();
  const { data, isLoading, refetch } = useCashierOperationsReport(dateRange, selectedOperator, reportType);

  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Handle export
  const handleExport = (format: 'excel' | 'pdf') => {
    if (!data) {
      toast.error('Não há dados para exportar');
      return;
    }

    try {
      if (format === 'excel') {
        exportToExcel({
          ...data,
          cashierName: 'Relatório',
          operations: data.operations || [],
          getUserName: (userId: string) => {
            const user = users.find(u => u.id === userId);
            return user ? user.name : `ID: ${userId.substring(0, 6)}`;
          }
        });
        toast.success('Relatório exportado com sucesso em formato EXCEL');
      } else {
        exportToPDF({
          ...data,
          cashierName: 'Relatório',
          operations: data.operations || [],
          getUserName: (userId: string) => {
            const user = users.find(u => u.id === userId);
            return user ? user.name : `ID: ${userId.substring(0, 6)}`;
          }
        });
        toast.success('Relatório exportado com sucesso em formato PDF');
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório. Tente novamente.');
    }
  };

  // Calculate total shortages if applicable
  const getTotalShortages = () => {
    if (!data || !data.shortages || data.shortages.length === 0) return 0;
    
    return data.shortages.reduce((total, shortage) => total + shortage.amount, 0);
  };

  // Helper to find user name
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `ID: ${userId.substring(0, 6)}`;
  };

  // Helper to format the discrepancy reason, removing any internal manager info
  const formatReason = (reason?: string): string => {
    if (!reason) return '-';
    
    // Check if the reason includes the "Autorizado por:" text
    const parts = reason.split('\nAutorizado por:');
    if (parts.length > 1) {
      return parts[0].trim();
    }
    
    return reason;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <CardTitle>Relatórios de Caixa</CardTitle>
            {data && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    Exportar Relatório
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    <FileIcon className="h-4 w-4 mr-2" />
                    Exportar para Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileIcon className="h-4 w-4 mr-2" />
                    Exportar para PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Date Range Selector */}
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                        </>
                      ) : (
                        formatDate(dateRange.from)
                      )
                    ) : (
                      <span>Selecione as datas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Operator Selector */}
            <div className="space-y-1.5">
              <Label>Operador</Label>
              <Select
                value={selectedOperator}
                onValueChange={setSelectedOperator}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os operadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os operadores</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Report Type Selector */}
            <div className="space-y-1.5">
              <Label>Tipo de Relatório</Label>
              <Select 
                value={reportType} 
                onValueChange={(value) => setReportType(value as 'operations' | 'closings' | 'shortages' | 'sales')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operations">Operações de Caixa</SelectItem>
                  <SelectItem value="closings">Fechamentos de Caixa</SelectItem>
                  <SelectItem value="shortages">Quebras de Caixa</SelectItem>
                  <SelectItem value="sales">Vendas por Operador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Generate Button */}
            <div className="md:col-span-3 mt-4">
              <Button 
                onClick={() => refetch()} 
                disabled={isLoading || !dateRange?.from || !dateRange?.to}
                className="w-full md:w-auto"
              >
                {isLoading ? "Gerando relatório..." : "Gerar Relatório"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {reportType === 'operations' && 'Relatório de Operações de Caixa'}
              {reportType === 'closings' && 'Relatório de Fechamentos de Caixa'}
              {reportType === 'shortages' && 'Relatório de Quebras de Caixa'}
              {reportType === 'sales' && 'Relatório de Vendas por Operador'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.operations?.length === 0 ? (
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Nenhum dado encontrado para o período e filtros selecionados.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {/* Summary Section */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {data.totalOperations}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {reportType === 'operations' && 'Total de Operações'}
                        {reportType === 'closings' && 'Total de Fechamentos'}
                        {reportType === 'shortages' && 'Total de Quebras'}
                        {reportType === 'sales' && 'Total de Vendas'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">
                        {data.totalAmount?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {reportType === 'operations' && 'Volume Total'}
                        {reportType === 'closings' && 'Volume Total Fechado'}
                        {reportType === 'shortages' && 'Volume Total de Quebras'}
                        {reportType === 'sales' && 'Volume Total de Vendas'}
                      </p>
                    </CardContent>
                  </Card>
                  
                  {reportType === 'shortages' && (
                    <Card className="bg-red-50 dark:bg-red-950/20">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {getTotalShortages().toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </div>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-2">
                          Valor Total de Quebras
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {reportType === 'sales' && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {data.averageTicket?.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          })}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Ticket Médio
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Data Table */}
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium text-sm">Data</th>
                          {reportType === 'operations' && (
                            <th className="px-4 py-3 text-left font-medium text-sm">Tipo</th>
                          )}
                          <th className="px-4 py-3 text-left font-medium text-sm">Operador</th>
                          <th className="px-4 py-3 text-left font-medium text-sm">Valor</th>
                          {reportType === 'shortages' && (
                            <th className="px-4 py-3 text-left font-medium text-sm">Motivo</th>
                          )}
                          {(reportType === 'shortages' || reportType === 'closings') && (
                            <th className="px-4 py-3 text-left font-medium text-sm">Autorizado por</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {data.operations?.map((op, index) => (
                          <tr 
                            key={index} 
                            className={`border-t ${op.isShortage ? 'bg-red-50 dark:bg-red-950/10' : ''}`}
                          >
                            <td className="px-4 py-3 text-sm">
                              {format(new Date(op.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </td>
                            {reportType === 'operations' && (
                              <td className="px-4 py-3 text-sm">
                                {op.operationType === 'open' && 'Abertura'}
                                {op.operationType === 'close' && 'Fechamento'}
                                {op.operationType === 'deposit' && 'Suprimento'}
                                {op.operationType === 'withdrawal' && 'Sangria'}
                                {op.operationType === 'sale' && 'Venda'}
                              </td>
                            )}
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3 opacity-70" />
                                {op.userName || getUserName(op.userId)}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {op.amount.toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              })}
                            </td>
                            {reportType === 'shortages' && (
                              <td className="px-4 py-3 text-sm">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help underline decoration-dotted underline-offset-2">
                                        {formatReason(op.discrepancyReason || op.reason)}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{formatReason(op.discrepancyReason || op.reason)}</p>
                                      {op.managerName && (
                                        <p className="flex items-center gap-1 mt-1 text-amber-500">
                                          <ShieldAlertIcon className="h-3 w-3" />
                                          Autorizado por: {op.managerName}
                                        </p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </td>
                            )}
                            {(reportType === 'shortages' || reportType === 'closings') && (
                              <td className="px-4 py-3 text-sm">
                                {op.managerName ? (
                                  <div className="flex items-center gap-1 text-amber-600">
                                    <ShieldAlertIcon className="h-3 w-3" />
                                    {op.managerName}
                                  </div>
                                ) : '-'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CashierOperationsReportContent;
