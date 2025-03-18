
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PrinterSettings } from '@/components/sales/PrinterSettings';

const Printers = () => {
  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Configurações de Impressoras</h1>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Configurar Impressoras</CardTitle>
        </CardHeader>
        <CardContent>
          <PrinterSettings />
        </CardContent>
      </Card>
    </div>
  );
};

export default Printers;
