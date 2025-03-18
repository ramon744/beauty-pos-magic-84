
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

// Compatibilidade com o toast da shadcn
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

const useToast = () => {
  return {
    toast,
  };
};

export { useToast, toast };
