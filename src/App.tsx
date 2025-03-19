
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Products from "./pages/Products";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import Customers from "./pages/Customers";
import Promotions from "./pages/Promotions";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import HistoryPage from "./pages/History";
import Printers from "./pages/Printers";
import Labels from "./pages/Labels";
import Cashiers from "./pages/Cashiers";
import CashierLink from "./pages/CashierLink";
import MainLayout from "./components/layout/MainLayout";
import { useDataMigration } from './hooks/use-data-migration';
import { toast } from "./components/ui/use-toast";

const queryClient = new QueryClient();

function App() {
  // Initialize data migration
  const { isMigrating, isCompleted, error } = useDataMigration();
  
  if (isMigrating) {
    console.log("Migration in progress...");
  }
  
  if (error) {
    console.error("Migration error:", error);
    toast({
      variant: "destructive",
      title: "Erro na migração de dados",
      description: error
    });
  }
  
  if (isCompleted) {
    console.log("Migration completed successfully!");
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Protected routes with MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/products" element={<Products />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/users" element={<Users />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/printers" element={<Printers />} />
                <Route path="/labels" element={<Labels />} />
                <Route path="/cashiers" element={<Cashiers />} />
                <Route path="/cashiers/link" element={<CashierLink />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
