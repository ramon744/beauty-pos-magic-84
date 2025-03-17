
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScan } from '@/hooks/use-barcode-scan';
import { useFetchProducts } from '@/hooks/use-products';
import { Product } from '@/types';

export const useProductSearch = (addProductToCart: (product: Product, qty: number) => void) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
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
      addProductToCart(product, 1);
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
      
      setSearchResults(results);
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
