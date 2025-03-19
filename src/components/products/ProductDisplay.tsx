
import React from 'react';
import { Package } from 'lucide-react';

interface ProductDisplayProps {
  name: string;
  image?: string;
}

export function ProductDisplay({ name, image }: ProductDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      {image ? (
        <img
          src={image}
          alt={name}
          className="h-8 w-8 rounded-md object-cover"
        />
      ) : (
        <Package className="h-8 w-8 text-muted-foreground" />
      )}
      <span>{name}</span>
    </div>
  );
}
