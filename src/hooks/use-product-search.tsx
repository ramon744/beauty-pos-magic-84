
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScan } from '@/hooks/use-barcode-scan';
import { useFetchProducts } from '@/hooks/use-products';

export const useProductSearch = (addProductToCart: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const { data: products = [] } = useFetchProducts();

  const handleBarcodeDetected = (barcode: string) => {
    toast({
      title: "Código de barras detectado",
      description: `Código: ${barcode}`,
    });
    
    const product = products.find(p => p.code === barcode);
    
    if (product) {
      const productToAdd = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.salePrice,
        stock: product.stock,
        category: product.category.name
      };
      
      addProductToCart(productToAdd, 1);
    } else {
      toast({
        title: "Produto não encontrado",
        description: `Nenhum produto encontrado com o código ${barcode}`,
        variant: "destructive"
      });
    }
  };

  const { startScanning, stopScanning, isScanning } = useBarcodeScan(handleBarcodeDetected);

  useEffect(() => {
    if (isScanning) {
      startScanning();
    }
  }, [isScanning, startScanning]);

  const toggleScanner = () => {
    if (isScanning) {
      stopScanning();
      toast({
        title: "Leitor de código de barras desativado",
      });
    } else {
      startScanning();
      toast({
        title: "Leitor de código de barras ativado",
        description: "Posicione o código de barras na frente da câmera"
      });
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.includes(searchQuery)
      );
      
      setSearchResults(results.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.salePrice,
        stock: p.stock,
        category: p.category.name
      })));
      
      setHasSearched(true);
      
      if (results.length === 0 && searchQuery.trim().length > 2) {
        toast({
          title: "Nenhum produto encontrado",
          description: "Tente outro termo de busca",
          variant: "destructive"
        });
      }
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [searchQuery, products, toast]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    hasSearched,
    isScanning,
    toggleScanner,
  };
};
