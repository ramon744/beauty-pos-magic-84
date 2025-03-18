
// Import the hooks from the correct location
import { useToast, toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

// Add error and success methods to sonnerToast if they don't exist already
if (!sonnerToast.error) {
  sonnerToast.error = (message: string, options?: any) => {
    return sonnerToast(message, {
      ...options,
      style: { backgroundColor: 'rgb(239, 68, 68)', color: 'white' }
    });
  };
}

if (!sonnerToast.success) {
  sonnerToast.success = (message: string, options?: any) => {
    return sonnerToast(message, {
      ...options,
      style: { backgroundColor: 'rgb(34, 197, 94)', color: 'white' }
    });
  };
}

export { useToast, toast, sonnerToast };
