
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockKeyhole, ShieldAlert, UserCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ManagerAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (managerId?: string, managerName?: string) => void;
  title?: string;
  description?: string;
  customContent?: React.ReactNode;
  customFormId?: string;
}

export const ManagerAuthDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Autenticação Gerencial",
  description = "Esta operação requer autorização de um gerente ou administrador.",
  customContent = null,
  customFormId = "discount-form",
}: ManagerAuthDialogProps) => {
  const [managerId, setManagerId] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if the ID exists and the password matches any manager or admin user
      const manager = users.find(
        (user) => 
          (user.role === "manager" || user.role === "admin") && 
          user.id === managerId &&
          user.password === password
      );

      if (manager) {
        console.log("Manager authentication successful for:", manager.id, manager.name);
        toast({
          title: "Autorização confirmada",
          description: "Operação permitida",
        });
        onConfirm(manager.id, manager.name); // Pass the manager ID and name to the callback
        resetForm();
      } else {
        toast({
          title: "Autorização negada",
          description: "ID gerencial ou senha incorretos",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setManagerId("");
    setPassword("");
  };

  // This function correctly passes the managerId to onConfirm
  const handleFormSubmit = () => {
    // Don't call onConfirm here as the actual auth hasn't happened yet
    // We'll call it from the parent component after successful authentication
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        {customContent ? (
          <>
            {customContent}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form={customFormId} 
                disabled={isSubmitting}
              >
                Continuar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="managerId"
                    type="text"
                    placeholder="ID do gerente"
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="pl-9"
                    autoComplete="off"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="managerPassword"
                    type="password"
                    placeholder="Senha gerencial"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={(!password || !managerId) || isSubmitting}>
                {isSubmitting ? "Verificando..." : "Autorizar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
