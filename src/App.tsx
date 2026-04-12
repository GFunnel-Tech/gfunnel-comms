import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { lazy, Suspense } from "react";

const ApiDocs = lazy(() => import("./pages/ApiDocs.tsx"));
const IntegrationsAdmin = lazy(() => import("./pages/IntegrationsAdmin.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/api-docs" element={<Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading docs...</div>}><ApiDocs /></Suspense>} />
          <Route path="/integrations" element={<Suspense fallback={<div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>}><IntegrationsAdmin /></Suspense>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
