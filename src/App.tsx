import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import { lazy, Suspense, ReactNode } from "react";

const ApiDocs = lazy(() => import("./pages/ApiDocs.tsx"));
const IntegrationsAdmin = lazy(() => import("./pages/IntegrationsAdmin.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, isEmbedded, bridgeTimedOut } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (isEmbedded && bridgeTimedOut && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-4 bg-background">
        <div className="text-3xl font-bold text-foreground tracking-tight">GFunnel</div>
        <div className="text-2xl">⚠️</div>
        <h2 className="text-lg font-semibold text-foreground">Connection timed out</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Unable to authenticate with the GFunnel platform. Please refresh the page or sign in directly.
        </p>
        <div className="flex gap-3 mt-2">
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors">
            Retry
          </button>
          <button onClick={() => window.location.href = '/auth'} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity">
            Sign in
          </button>
        </div>
      </div>
    );
  }
  if (!user && !isEmbedded) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading, isEmbedded } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;
  if (user || isEmbedded) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const Loading = () => <div className="flex items-center justify-center h-screen text-muted-foreground">Loading...</div>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<PublicOnlyRoute><Auth /></PublicOnlyRoute>} />
            <Route path="/reset-password" element={<Suspense fallback={<Loading />}><ResetPassword /></Suspense>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/api-docs" element={<ProtectedRoute><Suspense fallback={<Loading />}><ApiDocs /></Suspense></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Suspense fallback={<Loading />}><IntegrationsAdmin /></Suspense></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
