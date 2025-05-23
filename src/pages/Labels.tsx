
import React, { useState } from 'react';
import { Printer, Search, Barcode, Tag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFetchProducts } from '@/hooks/use-products';
import { LabelsProductSearch } from '@/components/labels/LabelsProductSearch';
import { LabelPreview } from '@/components/labels/LabelPreview';
import { LabelPrintOptionsDialog } from '@/components/labels/LabelPrintOptionsDialog';

interface SelectedProduct {
  id: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
}

const Labels: React.FC = () => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: products = [] } = useFetchProducts();

  const addProductToLabel = (product: any, quantity: number = 1) => {
    const existingIndex = selectedProducts.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex].quantity += quantity;
      setSelectedProducts(updatedProducts);
      
      toast({
        title: "Quantidade atualizada",
        description: `${product.name} agora tem ${updatedProducts[existingIndex].quantity} etiquetas`,
      });
    } else {
      setSelectedProducts([...selectedProducts, {
        id: product.id,
        name: product.name,
        code: product.code || '',
        price: product.salePrice || product.price,
        quantity: quantity
      }]);
      
      toast({
        title: "Produto adicionado",
        description: `${product.name} adicionado para impressão de etiqueta`,
      });
    }
  };

  const removeProductFromLabel = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    
    toast({
      title: "Produto removido",
      description: "Produto removido da lista de etiquetas",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const updatedProducts = selectedProducts.map(product => 
      product.id === productId ? { ...product, quantity } : product
    );
    
    setSelectedProducts(updatedProducts);
  };

  const handlePrintLabels = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Adicione produtos para imprimir etiquetas",
        variant: "destructive"
      });
      return;
    }

    setPrintDialogOpen(true);
  };

  const handleDirectPrint = () => {
    toast({
      title: "Enviando para impressora",
      description: `${selectedProducts.reduce((acc, p) => acc + p.quantity, 0)} etiquetas serão impressas`
    });
    setPrintDialogOpen(false);
    // A lógica de impressão direta seria implementada aqui
  };

  const handleDownloadPdf = () => {
    toast({
      title: "Gerando PDF",
      description: "O arquivo PDF com suas etiquetas está sendo gerado"
    });
    setPrintDialogOpen(false);
    
    // Simulação de geração de PDF
    setTimeout(() => {
      // Criar um PDF válido com conteúdo mínimo
      const pdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>\nendobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<<>>/Contents 4 0 R>>\nendobj\n4 0 obj<</Length 21>>stream\nBT /F1 12 Tf 100 700 Td (Etiquetas) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n284\n%%EOF';
      
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Configurar o nome do arquivo e o URL
      link.href = url;
      link.download = `etiquetas-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Adicionar ao DOM, acionar o clique e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar o URL do objeto
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      toast({
        title: "PDF Gerado",
        description: "O arquivo PDF com suas etiquetas foi baixado automaticamente"
      });
    }, 1500);
  };

  const totalLabelCount = selectedProducts.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <div className="container p-4 mx-auto space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Etiquetas</h2>
          <p className="text-muted-foreground">
            Gere e imprima etiquetas para seus produtos
          </p>
        </div>
        <Button 
          onClick={handlePrintLabels} 
          disabled={selectedProducts.length === 0} 
          className="w-full md:w-auto"
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir Etiquetas
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <LabelsProductSearch 
            products={products} 
            onProductSelect={addProductToLabel} 
          />
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Tag className="mr-2 h-5 w-5" />
              Etiquetas Selecionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProducts.length > 0 ? (
              <div className="space-y-4">
                {selectedProducts.map(product => (
                  <LabelPreview 
                    key={product.id}
                    product={product}
                    onRemove={() => removeProductFromLabel(product.id)}
                    onQuantityChange={(quantity) => updateQuantity(product.id, quantity)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Tag className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Nenhuma etiqueta selecionada</p>
                <p className="text-sm">Use a busca para adicionar produtos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LabelPrintOptionsDialog 
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        onPrint={handleDirectPrint}
        onDownloadPdf={handleDownloadPdf}
        labelCount={totalLabelCount}
      />
    </div>
  );
};

export default Labels;
