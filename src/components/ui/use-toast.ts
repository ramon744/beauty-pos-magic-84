
// Import the hooks from the correct location
import { useToast, toast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

// Add error and success methods to sonnerToast if they don't exist already
export { useToast, toast, sonnerToast };
