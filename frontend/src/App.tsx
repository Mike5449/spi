import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Services from "./pages/Services.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PaymentSuccess from "./pages/PaymentSuccess.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Services est désormais la page d'accueil de SPI */}
            <Route path="/" element={<Services />} />
            {/* L'ancienne landing (hero + features + docs + faq) déménage sous /developpeur */}
            <Route path="/developpeur" element={<Index />} />
            {/* Redirection douce de l'ancienne URL /services vers / */}
            <Route path="/services" element={<Services />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/inscription" element={<Signup />} />
            <Route
              path="/tableau-de-bord"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Page de redirection par défaut après un paiement MonCash réussi.
                Publique : reçoit le client en sortie du parcours de paiement. */}
            <Route path="/paiement/succes" element={<PaymentSuccess />} />
            {/* AJOUTER LES ROUTES AU-DESSUS DE LA CATCH-ALL "*" */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
