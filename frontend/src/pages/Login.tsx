import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, LogIn, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username || !password) {
      setError("Tous les champs sont requis.");
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success("Connecté !");
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? "Nom d'utilisateur ou mot de passe incorrect."
            : err.message
          : "Erreur de connexion au serveur.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 dot-pattern">
      <Link to="/" className="flex items-center gap-2 mb-8" aria-label="Accueil">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">SPI</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-card rounded-2xl p-8 border border-border shadow-lg"
      >
        <h1 className="text-2xl font-bold text-foreground mb-1">Connexion</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Heureux de vous revoir. Entrez vos identifiants pour continuer.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="jean.baptiste"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connexion…
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Se connecter
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Pas encore de compte ?{" "}
          <Link
            to="/inscription"
            className="text-primary font-medium hover:underline"
          >
            S'inscrire
          </Link>
        </p>
      </motion.div>

      <Link
        to="/"
        className="text-xs text-muted-foreground hover:text-foreground mt-6"
      >
        ← Retour à l'accueil
      </Link>
    </div>
  );
};

export default Login;
