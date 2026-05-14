import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, MessageCircle, UserPlus, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [field]: e.target.value });

  const validate = (): string | null => {
    if (!form.username || !form.email || !form.phone || !form.password) {
      return "Tous les champs sont requis.";
    }
    if (form.username.length < 3) {
      return "Le nom d'utilisateur doit faire au moins 3 caractères.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Adresse e-mail invalide.";
    }
    // Téléphone : au moins 7 chiffres, accepte espaces, tirets, +, parenthèses
    const digits = form.phone.replace(/[^0-9]/g, "");
    if (digits.length < 7) {
      return "Numéro de téléphone invalide (au moins 7 chiffres).";
    }
    if (form.password.length < 6) {
      return "Le mot de passe doit faire au moins 6 caractères.";
    }
    if (form.password !== form.confirm) {
      return "Les mots de passe ne correspondent pas.";
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signup({
        username: form.username,
        email: form.email,
        phone: form.phone.trim(),
        password: form.password,
      });
      toast.success("Compte créé !");
      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 400 || err.status === 409
            ? "Un compte existe déjà avec ce nom ou cet e-mail."
            : err.message
          : "Erreur de connexion au serveur.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 dot-pattern">
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
        <h1 className="text-2xl font-bold text-foreground mb-1">Créer un compte</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Commencez en quelques secondes. C'est gratuit.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              autoComplete="username"
              value={form.username}
              onChange={update("username")}
              placeholder="jean.baptiste"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update("email")}
              placeholder="jean@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="phone">
              <span className="inline-flex items-center gap-1.5">
                Téléphone (WhatsApp)
                <MessageCircle className="h-3.5 w-3.5 text-primary" />
              </span>
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={update("phone")}
              placeholder="509 31 90 75 23"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              En mode test, nous vous envoyons vos{" "}
              <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">
                MONCASH_CLIENT_ID
              </code>{" "}
              et{" "}
              <code className="bg-secondary px-1 py-0.5 rounded text-[10px]">
                MONCASH_CLIENT_SECRET
              </code>{" "}
              à ce numéro sous 24h. Il sert aussi à tester les paiements en
              sandbox.
            </p>
          </div>

          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={update("password")}
              placeholder="Au moins 6 caractères"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={update("confirm")}
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
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 glow-accent font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création…
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Créer mon compte
              </>
            )}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Déjà inscrit ?{" "}
          <Link
            to="/connexion"
            className="text-primary font-medium hover:underline"
          >
            Se connecter
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

export default Signup;
