
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Printer, Save, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { storageService, STORAGE_KEYS } from '@/services/storage-service';
import { useToast } from '@/hooks/use-toast';

// Define printer settings schema
const printerFormSchema = z.object({
  name: z.string().min(1, { message: "Nome da impressora é obrigatório" }),
  isDefault: z.boolean().default(false),
  width: z.string().min(1, { message: "Largura do papel é obrigatória" }),
  deviceName: z.string().optional(),
  isNetworkPrinter: z.boolean().default(false),
  ipAddress: z.string().optional(),
  port: z.string().optional(),
});

type PrinterFormValues = z.infer<typeof printerFormSchema>;

interface Printer {
  id: string;
  name: string;
  isDefault: boolean;
  width: string;
  deviceName?: string;
  isNetworkPrinter: boolean;
  ipAddress?: string;
  port?: string;
}

export const PrinterSettings = () => {
  const { toast } = useToast();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(null);
  
  const form = useForm<PrinterFormValues>({
    resolver: zodResolver(printerFormSchema),
    defaultValues: {
      name: '',
      isDefault: false,
      width: '80', // Default width in mm
      deviceName: '',
      isNetworkPrinter: false,
      ipAddress: '',
      port: '9100', // Default printer port
    },
  });
  
  // Load saved printers
  useEffect(() => {
    const savedPrinters = storageService.getItem<Printer[]>(STORAGE_KEYS.PRINTERS) || [];
    setPrinters(savedPrinters);
    
    // Select default printer if exists
    const defaultPrinter = savedPrinters.find(p => p.isDefault);
    if (defaultPrinter) {
      setSelectedPrinterId(defaultPrinter.id);
      loadPrinterToForm(defaultPrinter);
    } else if (savedPrinters.length > 0) {
      setSelectedPrinterId(savedPrinters[0].id);
      loadPrinterToForm(savedPrinters[0]);
    }
  }, []);
  
  const loadPrinterToForm = (printer: Printer) => {
    form.reset({
      name: printer.name,
      isDefault: printer.isDefault,
      width: printer.width,
      deviceName: printer.deviceName || '',
      isNetworkPrinter: printer.isNetworkPrinter,
      ipAddress: printer.ipAddress || '',
      port: printer.port || '9100',
    });
  };
  
  const handleSelectPrinter = (printerId: string) => {
    setSelectedPrinterId(printerId);
    const printer = printers.find(p => p.id === printerId);
    if (printer) {
      loadPrinterToForm(printer);
    }
  };
  
  const handleAddNewPrinter = () => {
    // Reset form with default values
    form.reset({
      name: '',
      isDefault: printers.length === 0, // Set as default if it's the first printer
      width: '80',
      deviceName: '',
      isNetworkPrinter: false,
      ipAddress: '',
      port: '9100',
    });
    setSelectedPrinterId(null);
  };
  
  const handleDeletePrinter = () => {
    if (!selectedPrinterId) return;
    
    const updatedPrinters = printers.filter(p => p.id !== selectedPrinterId);
    
    // If deleted printer was default and there are other printers, set the first one as default
    if (printers.find(p => p.id === selectedPrinterId)?.isDefault && updatedPrinters.length > 0) {
      updatedPrinters[0].isDefault = true;
    }
    
    setPrinters(updatedPrinters);
    storageService.setItem(STORAGE_KEYS.PRINTERS, updatedPrinters);
    
    toast({
      title: "Impressora excluída",
      description: "A impressora foi excluída com sucesso."
    });
    
    if (updatedPrinters.length > 0) {
      setSelectedPrinterId(updatedPrinters[0].id);
      loadPrinterToForm(updatedPrinters[0]);
    } else {
      handleAddNewPrinter();
    }
  };
  
  const onSubmit = (values: PrinterFormValues) => {
    // Generate a new printer object
    const updatedPrinter: Printer = {
      id: selectedPrinterId || `printer-${Date.now()}`,
      ...values
    };
    
    let updatedPrinters: Printer[];
    
    if (selectedPrinterId) {
      // Update existing printer
      updatedPrinters = printers.map(p => 
        p.id === selectedPrinterId ? updatedPrinter : 
        // If this printer is set as default, make sure to remove default from others
        updatedPrinter.isDefault ? { ...p, isDefault: false } : p
      );
    } else {
      // Add new printer
      updatedPrinters = [
        ...printers.map(p => updatedPrinter.isDefault ? { ...p, isDefault: false } : p),
        updatedPrinter
      ];
    }
    
    // If no printer is set as default, set this one
    if (!updatedPrinters.some(p => p.isDefault)) {
      updatedPrinter.isDefault = true;
    }
    
    setPrinters(updatedPrinters);
    setSelectedPrinterId(updatedPrinter.id);
    storageService.setItem(STORAGE_KEYS.PRINTERS, updatedPrinters);
    
    toast({
      title: selectedPrinterId ? "Impressora atualizada" : "Impressora adicionada",
      description: selectedPrinterId 
        ? "As configurações da impressora foram atualizadas com sucesso."
        : "A nova impressora foi adicionada com sucesso."
    });
  };
  
  // Watch isNetworkPrinter to conditionally render fields
  const isNetworkPrinter = form.watch("isNetworkPrinter");
  
  const testPrinter = () => {
    toast({
      title: "Teste de impressão",
      description: "Enviando teste para a impressora. Verifique se um recibo de teste foi impresso."
    });
    
    // In a real application, we would send a test print job
    // For now, we'll just simulate it with a timeout
    setTimeout(() => {
      toast({
        title: "Teste de impressão",
        description: "Teste enviado com sucesso!"
      });
    }, 1500);
  };
  
  return (
    <Tabs defaultValue="printers" className="w-full">
      <TabsList className="grid w-full grid-cols-1 h-auto mb-4">
        <TabsTrigger value="printers" className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Impressoras
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="printers" className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Impressoras Configuradas</CardTitle>
              <CardDescription>
                Gerencie as impressoras para emissão de cupons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <Button 
                  variant="outline" 
                  onClick={handleAddNewPrinter}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Impressora
                </Button>
                
                {selectedPrinterId && (
                  <Button 
                    variant="destructive" 
                    onClick={handleDeletePrinter}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </div>
              
              {printers.length === 0 ? (
                <div className="text-center p-6 border rounded-md bg-muted/20">
                  <Printer className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhuma impressora configurada. Adicione uma nova impressora para começar.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {printers.map((printer) => (
                    <Button
                      key={printer.id}
                      variant={printer.id === selectedPrinterId ? "default" : "outline"}
                      className="justify-start h-auto py-2 px-3"
                      onClick={() => handleSelectPrinter(printer.id)}
                    >
                      <div className="flex flex-col items-start text-left">
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          <span className="font-medium">{printer.name}</span>
                          {printer.isDefault && (
                            <span className="text-xs bg-primary-foreground text-primary px-1.5 py-0.5 rounded-full">Padrão</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {printer.isNetworkPrinter 
                            ? `Rede: ${printer.ipAddress || 'N/A'}`
                            : `Dispositivo: ${printer.deviceName || 'Local'}`
                          }
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>
                {selectedPrinterId 
                  ? "Editar Impressora" 
                  : "Adicionar Nova Impressora"
                }
              </CardTitle>
              <CardDescription>
                Configure as opções da impressora para cupons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Impressora</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Impressora do Caixa" {...field} />
                        </FormControl>
                        <FormDescription>
                          Um nome fácil de identificar para esta impressora
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Impressora Padrão</FormLabel>
                          <FormDescription>
                            Definir como impressora padrão para cupons
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura do Papel (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          A largura do papel em milímetros (normalmente 58mm ou 80mm)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isNetworkPrinter"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Impressora de Rede</FormLabel>
                          <FormDescription>
                            Ative para configurar uma impressora conectada via rede
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {isNetworkPrinter ? (
                    <>
                      <FormField
                        control={form.control}
                        name="ipAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço IP</FormLabel>
                            <FormControl>
                              <Input placeholder="192.168.1.100" {...field} />
                            </FormControl>
                            <FormDescription>
                              Endereço IP da impressora na rede
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Porta</FormLabel>
                            <FormControl>
                              <Input placeholder="9100" {...field} />
                            </FormControl>
                            <FormDescription>
                              Porta de comunicação (normalmente 9100)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <FormField
                      control={form.control}
                      name="deviceName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Dispositivo</FormLabel>
                          <FormControl>
                            <Input placeholder="Impressora Térmica" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nome do dispositivo conforme aparece no sistema
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-between mt-6 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={testPrinter}
                      className="flex items-center gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Testar Impressão
                    </Button>
                    
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Salvar Configurações
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};
