
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/types';

interface UserRoleSelectProps {
  value: UserRole;
  onValueChange: (value: UserRole) => void;
  disabled?: boolean;
}

export function UserRoleSelect({ value, onValueChange, disabled }: UserRoleSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(newValue: string) => onValueChange(newValue as UserRole)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione o perfil" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrador</SelectItem>
        <SelectItem value="manager">Gerente</SelectItem>
        <SelectItem value="employee">Atendente</SelectItem>
      </SelectContent>
    </Select>
  );
}
