import React, { useState, useMemo } from 'react';
import { useFetchProducts } from '@/hooks/use-products';
import { Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CalendarClock, CalendarX, CheckCircle2, Search, SortAsc, SortDesc } from 'lucide-react';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Define expiration categories
type ExpirationCategory = 'expired' | 'expiringSoon' | 'valid' | 'noExpiration';
type SortDirection = 'asc' | 'desc';
type SortField = 'name' | 'code' | 'expirationDate' | 'daysRemaining';

// Helper function to calculate days until expiration
const getDaysUntilExpiration = (expirationDate: Date | undefined): number | null => {
  if (!expirationDate) return null;
  return differenceInDays(expirationDate, new Date());
};

// Helper function to determine product expiration category
const getExpirationCategory = (product: Product): ExpirationCategory => {
  if (!product.expirationDate) return 'noExpiration';
  
  const today = new Date();
  const expirationDate = new Date(product.expirationDate);
  const thirtyDaysFromNow = addDays(today, 30);
  
  if (isBefore(expirationDate, today)) {
    return 'expired';
  } else if (isBefore(expirationDate, thirtyDaysFromNow)) {
    return 'expiringSoon';
  } else {
    return 'valid';
  }
};

// Helper function to get badge color based on expiration category
const getExpirationBadge = (category: ExpirationCategory) => {
  switch (category) {
    case 'expired':
      return <Badge variant="destructive" className="flex items-center gap-1"><CalendarX className="w-3 h-3" /> Vencido</Badge>;
    case 'expiringSoon':
      return <Badge variant="warning" className="bg-yellow-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Vence em breve</Badge>;
    case 'valid':
      return <Badge variant="success" className="bg-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Válido</Badge>;
    case 'noExpiration':
      return <Badge variant="outline" className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Sem validade</Badge>;
  }
};

// Helper function to format the expiration date and days remaining
const formatExpirationInfo = (product: Product) => {
  if (!product.expirationDate) return 'Não aplicável';
  
  const daysRemaining = getDaysUntilExpiration(product.expirationDate as Date);
  const expirationDate = new Date(product.expirationDate);
  
  if (daysRemaining === null) return 'Data inválida';
  
  const formattedDate = format(expirationDate, 'dd/MM/yyyy', { locale: ptBR });
  
  if (daysRemaining < 0) {
    return `${formattedDate} (Vencido há ${Math.abs(daysRemaining)} dias)`;
  } else if (daysRemaining === 0) {
    return `${formattedDate} (Vence hoje)`;
  } else {
    return `${formattedDate} (${daysRemaining} dias restantes)`;
  }
};

export const ExpirationControl = () => {
  // The useFetchProducts hook now automatically filters out deleted products
  const { data: products, isLoading } = useFetchProducts();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('daysRemaining');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Categorize and filter products
  const categorizedProducts = useMemo(() => {
    if (!products) return { all: [], expired: [], expiringSoon: [], valid: [], noExpiration: [] };
    
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const result = {
      all: filtered,
      expired: filtered.filter(p => getExpirationCategory(p) === 'expired'),
      expiringSoon: filtered.filter(p => getExpirationCategory(p) === 'expiringSoon'),
      valid: filtered.filter(p => getExpirationCategory(p) === 'valid'),
      noExpiration: filtered.filter(p => getExpirationCategory(p) === 'noExpiration'),
    };
    
    return result;
  }, [products, searchQuery]);
  
  // Sort products based on current sort field and direction
  const sortedProducts = useMemo(() => {
    if (!categorizedProducts[selectedCategory as keyof typeof categorizedProducts]) {
      return [];
    }

    return [...categorizedProducts[selectedCategory as keyof typeof categorizedProducts]].sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else if (sortField === 'code') {
        return sortDirection === 'asc'
          ? a.code.localeCompare(b.code)
          : b.code.localeCompare(a.code);
      } else if (sortField === 'expirationDate' || sortField === 'daysRemaining') {
        // If no expiration date, place at the end for asc, beginning for desc
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return sortDirection === 'asc' ? 1 : -1;
        if (!b.expirationDate) return sortDirection === 'asc' ? -1 : 1;
        
        const dateA = new Date(a.expirationDate);
        const dateB = new Date(b.expirationDate);
        
        return sortDirection === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }
      return 0;
    });
  }, [categorizedProducts, selectedCategory, sortField, sortDirection]);
  
  // Handle sort toggle
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get statistics for expiration categories
  const getStats = () => {
    return {
      total: categorizedProducts.all.length,
      expired: categorizedProducts.expired.length,
      expiringSoon: categorizedProducts.expiringSoon.length,
      valid: categorizedProducts.valid.length,
      noExpiration: categorizedProducts.noExpiration.length,
    };
  };
  
  const stats = getStats();
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Expiration Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarX className="h-5 w-5" />
              Produtos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.expired}</div>
            <CardDescription>
              {stats.expired === 0 
                ? 'Nenhum produto vencido' 
                : `${((stats.expired / stats.total) * 100).toFixed(1)}% do total`}
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Vence em Breve
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.expiringSoon}</div>
            <CardDescription>
              Produtos que vencem nos próximos 30 dias
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card className="bg-green-600/10 border-green-600/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Produtos Válidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.valid}</div>
            <CardDescription>
              Com validade superior a 30 dias
            </CardDescription>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Sem Validade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.noExpiration}</div>
            <CardDescription>
              Produtos sem data de validade definida
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different expiration categories */}
      <Tabs
        defaultValue="all"
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
          <TabsTrigger 
            value="expired" 
            className="text-destructive"
          >
            Vencidos ({stats.expired})
          </TabsTrigger>
          <TabsTrigger 
            value="expiringSoon"
            className="text-yellow-600"
          >
            Vence em Breve ({stats.expiringSoon})
          </TabsTrigger>
          <TabsTrigger 
            value="valid"
            className="text-green-600"
          >
            Válidos ({stats.valid})
          </TabsTrigger>
          <TabsTrigger value="noExpiration">
            Sem Validade ({stats.noExpiration})
          </TabsTrigger>
        </TabsList>
        
        {/* Tab content with products table */}
        <TabsContent value={selectedCategory} className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle('name')}>
                        <div className="flex items-center">
                          Produto
                          {sortField === 'name' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle('code')}>
                        <div className="flex items-center">
                          Código
                          {sortField === 'code' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSortToggle('expirationDate')}>
                        <div className="flex items-center">
                          Data de Validade
                          {sortField === 'expirationDate' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Estoque</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          Nenhum produto encontrado nesta categoria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedProducts.map((product) => {
                        const category = getExpirationCategory(product);
                        return (
                          <TableRow key={product.id} className={
                            category === 'expired' 
                              ? 'bg-destructive/5' 
                              : category === 'expiringSoon' 
                                ? 'bg-yellow-500/5' 
                                : ''
                          }>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.code}</TableCell>
                            <TableCell>{formatExpirationInfo(product)}</TableCell>
                            <TableCell>{getExpirationBadge(category)}</TableCell>
                            <TableCell>
                              {product.stock === 0 ? (
                                <Badge variant="outline" className="bg-gray-100">Sem estoque</Badge>
                              ) : (
                                product.stock
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpirationControl;
