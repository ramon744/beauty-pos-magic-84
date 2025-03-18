
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

const Cashiers = () => {
  const [activeTab, setActiveTab] = useState('open');
  
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
            <Button>Abrir Novo Caixa</Button>
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
                  <TableRow>
                    <TableCell>Maria Silva</TableCell>
                    <TableCell>Caixa 1</TableCell>
                    <TableCell>09:15 - 12/05/2023</TableCell>
                    <TableCell>R$ 200,00</TableCell>
                    <TableCell>R$ 1.542,75</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye size={16} className="mr-1" /> Detalhes
                        </Button>
                        <Button variant="default" size="sm">
                          Fechar Caixa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>João Oliveira</TableCell>
                    <TableCell>Caixa 2</TableCell>
                    <TableCell>10:00 - 12/05/2023</TableCell>
                    <TableCell>R$ 200,00</TableCell>
                    <TableCell>R$ 875,50</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye size={16} className="mr-1" /> Detalhes
                        </Button>
                        <Button variant="default" size="sm">
                          Fechar Caixa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
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
                  <SelectItem value="1">Maria Silva</SelectItem>
                  <SelectItem value="2">João Oliveira</SelectItem>
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
                  <TableRow>
                    <TableCell>Maria Silva</TableCell>
                    <TableCell>Caixa 1</TableCell>
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
                  <TableRow>
                    <TableCell>João Oliveira</TableCell>
                    <TableCell>Caixa 2</TableCell>
                    <TableCell>10:00 - 11/05/2023</TableCell>
                    <TableCell>19:45 - 11/05/2023</TableCell>
                    <TableCell>R$ 200,00</TableCell>
                    <TableCell>R$ 2.875,50</TableCell>
                    <TableCell className="text-red-500">-R$ 10,00</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye size={16} className="mr-1" /> Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
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
                    <Select>
                      <SelectTrigger id="cashier-out">
                        <SelectValue placeholder="Selecione um caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Caixa 1 - Maria Silva</SelectItem>
                        <SelectItem value="2">Caixa 2 - João Oliveira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="value-out">Valor</Label>
                    <Input type="number" id="value-out" placeholder="0,00" />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="reason-out">Motivo</Label>
                    <Input type="text" id="reason-out" placeholder="Motivo da retirada" />
                  </div>
                  <Button className="w-full">Confirmar Sangria</Button>
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
                    <Select>
                      <SelectTrigger id="cashier-in">
                        <SelectValue placeholder="Selecione um caixa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Caixa 1 - Maria Silva</SelectItem>
                        <SelectItem value="2">Caixa 2 - João Oliveira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="value-in">Valor</Label>
                    <Input type="number" id="value-in" placeholder="0,00" />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="reason-in">Motivo</Label>
                    <Input type="text" id="reason-in" placeholder="Motivo da entrada" />
                  </div>
                  <Button className="w-full">Confirmar Suprimento</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Cashiers;
