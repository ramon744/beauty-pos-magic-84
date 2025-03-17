
import React, { useRef } from 'react';
import { Search, Barcode, X, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CardTitle, CardContent } from '@/components/ui/card';
import { ProductSearchTable } from './ProductSearchTable';
import { Product } from '@/types';
import { CartProduct } from '@/hooks/use-cart';

interface ProductSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Product[];
  hasSearched: boolean;
  isScanning: boolean;
  toggleScanner: () => void;
  addProductToCart: (product: Product, qty: number) => void;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  hasSearched,
  isScanning,
  toggleScanner,
  addProductToCart,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <CardTitle className="text-lg flex items-center justify-between">
        <div className="flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Buscar Produtos
        </div>
        <Button 
          onClick={toggleScanner} 
          variant={isScanning ? "destructive" : "outline"}
          size="sm"
          className="ml-auto"
        >
          {isScanning ? (
            <>
              <X className="mr-1 h-4 w-4" />
              Desativar Scanner
            </>
          ) : (
            <>
              <Barcode className="mr-1 h-4 w-4" />
              Leitor de Código
            </>
          )}
        </Button>
      </CardTitle>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              ref={searchInputRef}
              placeholder="Buscar por nome, código ou SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        {isScanning && (
          <div className="mb-4 p-4 border rounded-md bg-muted/20">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="text-center flex-1">
                <Camera className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Posicione o código de barras na frente da câmera
                </p>
              </div>
            </div>
          </div>
        )}
        
        {searchQuery.trim() && (
          <>
            {searchResults.length > 0 ? (
              <ProductSearchTable 
                searchResults={searchResults} 
                addProductToCart={addProductToCart} 
              />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum produto encontrado. Tente outra busca.
              </div>
            )}
          </>
        )}
      </CardContent>
    </>
  );
};
