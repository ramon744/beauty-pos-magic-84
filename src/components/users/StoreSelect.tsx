
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Store {
  id: string;
  name: string;
  createdAt: Date;
}

interface StoreSelectProps {
  stores: Store[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  includeAllOption?: boolean;
}

export function StoreSelect({ 
  stores, 
  value, 
  onValueChange, 
  disabled,
  includeAllOption = false
}: StoreSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione a loja" />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && (
          <SelectItem value="all">Todas as lojas</SelectItem>
        )}
        {stores.map(store => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
