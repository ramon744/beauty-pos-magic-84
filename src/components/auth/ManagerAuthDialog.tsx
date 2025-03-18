
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
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ManagerAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (managerId?: string) => void;
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
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { users } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if the password matches any manager or admin user
      const manager = users.find(
        (user) => 
          (user.role === "manager" || user.role === "admin") && 
          user.password === password
      );

      if (manager) {
        toast({
          title: "Autorização confirmada",
          description: "Operação permitida",
        });
        onConfirm(manager.id); // Pass the manager ID to the callback
        onClose();
        setPassword("");
      } else {
        toast({
          title: "Autorização negada",
          description: "Senha gerencial incorreta",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For custom forms, pass the manager ID directly to onConfirm
    // This prevents type errors with form event vs string parameter
    onConfirm(undefined);
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
                onClick={handleFormSubmit}
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
              <Button type="submit" disabled={!password || isSubmitting}>
                {isSubmitting ? "Verificando..." : "Autorizar"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
