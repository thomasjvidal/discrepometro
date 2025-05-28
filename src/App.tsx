import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import DiscrepometroUpload from "./components/DiscrepometroUpload";
import Navigation from "./components/Navigation";

console.log('App.tsx: Iniciando renderização');

const queryClient = new QueryClient();

const App = () => {
  console.log('App.tsx: Renderizando componente');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<Upload />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/discrepometro" element={<DiscrepometroUpload />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
