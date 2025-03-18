
import { useState } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

// Create a toast function with variant methods
const createToastWithVariants = () => {
  // Base toast function
  const toastFn = ({
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

  // Add variant methods
  toastFn.success = (title: string, description?: string, duration = 3000) => {
    return sonnerToast.success(title, {
      description: description,
      duration: duration,
    });
  };

  toastFn.error = (title: string, description?: string, duration = 3000) => {
    return sonnerToast.error(title, {
      description: description,
      duration: duration,
    });
  };

  toastFn.warning = (title: string, description?: string, duration = 3000) => {
    return sonnerToast.warning(title, {
      description: description,
      duration: duration,
    });
  };

  toastFn.info = (title: string, description?: string, duration = 3000) => {
    return sonnerToast.info(title, {
      description: description,
      duration: duration,
    });
  };

  return toastFn;
};

// Create the toast with variants
export const toast = createToastWithVariants();

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
