
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ImageUploadProps {
  existingImage?: string;
  onImageUploaded: (imageUrl: string) => void;
}

export function ImageUpload({ existingImage, onImageUploaded }: ImageUploadProps) {
  const { toast } = useToast();
  const [image, setImage] = useState<string | undefined>(existingImage);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, selecione uma imagem válida (JPG, PNG, etc).',
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB.',
      });
      return;
    }

    setIsUploading(true);
    
    // In a real app, we would upload the image to a server
    // For now, we'll just create a data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      setImage(imageUrl);
      onImageUploaded(imageUrl);
      setIsUploading(false);
      
      toast({
        title: 'Imagem carregada',
        description: 'A imagem foi carregada com sucesso.',
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(undefined);
    onImageUploaded('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Imagem do Produto</h3>
        {image && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeImage}
          >
            <X className="mr-2 h-4 w-4" /> Remover
          </Button>
        )}
      </div>

      {image ? (
        <div className="relative aspect-square w-full max-w-md mx-auto rounded-md overflow-hidden border">
          <img
            src={image}
            alt="Product"
            className="object-contain w-full h-full"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-md">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Arraste e solte uma imagem ou clique para fazer upload
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            PNG, JPG ou GIF (máx. 5MB)
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            className="relative"
          >
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Enviando...' : 'Fazer Upload'}
          </Button>
        </div>
      )}
    </div>
  );
}
