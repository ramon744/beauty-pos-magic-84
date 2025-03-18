
import { useState, useEffect, useRef } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

// Compatibility with the sonner toast
const toast = ({
  title,
  description,
  variant = "default",
  duration = 3000,
}: ToastProps) => {
  if (variant === "destructive") {
    return sonnerToast.error(title || "", {
      description: description,
      duration: duration,
    });
  }

  return sonnerToast(title || "", {
    description: description,
    duration: duration,
  });
};

// Add empty toasts array to be compatible with shadcn/ui Toaster component
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  return {
    toast,
    toasts,
    // These functions are stubs to maintain compatibility with shadcn's useToast
    dismiss: (toastId?: string) => {},
    remove: (toastId?: string) => {},
  };
};

export { toast };
