import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  ListChecks,
  Loader2,
  Percent,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import EndpointTester from "@/components/EndpointTester";
import TransactionsTable from "@/components/TransactionsTable";
import CommissionCard from "@/components/CommissionCard";
import AdminUsersPanel from "@/components/AdminUsersPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import {
  apiKeyApi,
  ApiError,
  type ApiKey,
  type ApiKeyCreated,
  type Environment,
} from "@/lib/api";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR") : "—";

const Dashboard = () => {
  const { username, isSuperAdmin } = useAuth();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modale création
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    environment: "sandbox" as Environment,
    client_id: "",
    client_secret: "",
    redirect_url: "",
  });
  const [creating, setCreating] = useState(false);

  // Modale affichage clé créée
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);

  // Modale révocation
  const [toRevoke, setToRevoke] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Compteur pour forcer le refresh des transactions après chaque appel MonCash
  const [txRefresh, setTxRefresh] = useState(0);
  const refreshTransactions = () => setTxRefresh((n) => n + 1);

  const fetchKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiKeyApi.list();
      setKeys(data);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Erreur de chargement des clés."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.client_id || !createForm.client_secret) {
      toast.error("Le nom et les credentials MonCash sont requis.");
      return;
    }
    const redirect = createForm.redirect_url.trim();
    if (redirect && !/^https?:\/\//.test(redirect)) {
      toast.error("L'URL de redirection doit commencer par http:// ou https://");
      return;
    }
    setCreating(true);
    try {
      const created = await apiKeyApi.create({
        name: createForm.name,
        environment: createForm.environment,
        client_id: createForm.client_id,
        client_secret: createForm.client_secret,
        redirect_url: redirect || undefined,
      });
      setCreatedKey(created);
      setCreateOpen(false);
      setCreateForm({
        name: "",
        environment: "sandbox",
        client_id: "",
        client_secret: "",
        redirect_url: "",
      });
      await fetchKeys();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Erreur lors de la création.";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = async () => {
    if (!toRevoke) return;
    setRevoking(true);
    try {
      await apiKeyApi.revoke(toRevoke.id);
      toast.success("Clé révoquée.");
      setToRevoke(null);
      await fetchKeys();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Erreur lors de la révocation.";
      toast.error(msg);
    } finally {
      setRevoking(false);
    }
  };

  const copyKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      toast.success("Clé copiée dans le presse-papier.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier — copiez manuellement.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 md:px-8 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-5xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de bord
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bonjour {username ?? "👋"} — gérez vos clés, testez l'API et
              consultez vos transactions.
            </p>
          </div>

          <Tabs defaultValue={isSuperAdmin ? "admin" : "keys"} className="w-full">
            <TabsList className="mb-6 flex-wrap h-auto">
              <TabsTrigger value="keys">
                <KeyRound className="mr-1.5 h-4 w-4" /> Mes clés API
              </TabsTrigger>
              <TabsTrigger value="tester">
                <Play className="mr-1.5 h-4 w-4" /> Tester
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <ListChecks className="mr-1.5 h-4 w-4" /> Transactions
              </TabsTrigger>
              <TabsTrigger value="commission">
                <Percent className="mr-1.5 h-4 w-4" /> Commission
              </TabsTrigger>
              {isSuperAdmin && (
                <TabsTrigger value="admin">
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Admin
                </TabsTrigger>
              )}
            </TabsList>

          {/* ============================== */}
          {/* Tab : Mes clés API             */}
          {/* ============================== */}
          <TabsContent value="keys" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Nouvelle clé
            </Button>
          </div>

          <div className="glass-card rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement…
              </div>
            ) : error ? (
              <div className="p-8 flex items-start gap-3 text-destructive">
                <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium">Erreur</div>
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            ) : keys.length === 0 ? (
              <div className="p-12 text-center">
                <KeyRound className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-foreground">
                  Aucune clé pour le moment
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-5">
                  Créez votre première clé API pour commencer à accepter les paiements MonCash.
                </p>
                <Button
                  onClick={() => setCreateOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="mr-2 h-4 w-4" /> Créer une clé
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Préfixe</TableHead>
                    <TableHead>Environnement</TableHead>
                    <TableHead>Redirection</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead>Dernière utilisation</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-secondary px-2 py-1 rounded">
                          {k.key_prefix}…
                        </code>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded ${
                            k.environment === "live"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {k.environment}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {k.redirect_url ? (
                          <a
                            href={k.redirect_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate inline-block max-w-[160px] align-middle"
                            title={k.redirect_url}
                          >
                            {k.redirect_url}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(k.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(k.last_used_at)}
                      </TableCell>
                      <TableCell>
                        {k.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <span className="h-2 w-2 rounded-full bg-green-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                            Révoquée
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {k.is_active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToRevoke(k)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/5"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Révoquer</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-6 text-xs text-muted-foreground">
            <p>
              <strong>Sandbox vs Live :</strong> Le mode <em>sandbox</em> utilise
              l'environnement de test MonCash de Digicel. Le mode <em>live</em>{" "}
              utilise vos vrais credentials et débite/crédite de vrais comptes
              MonCash. Pour les credentials sandbox, contactez notre support.
            </p>
          </div>
          </TabsContent>

          {/* ============================== */}
          {/* Tab : Tester                   */}
          {/* ============================== */}
          <TabsContent value="tester">
            <EndpointTester
              apiKeys={keys.filter((k) => k.is_active)}
              onSuccess={refreshTransactions}
            />
          </TabsContent>

          {/* ============================== */}
          {/* Tab : Transactions             */}
          {/* ============================== */}
          <TabsContent value="transactions">
            <TransactionsTable refreshKey={txRefresh} />
          </TabsContent>

          {/* ============================== */}
          {/* Tab : Commission               */}
          {/* ============================== */}
          <TabsContent value="commission">
            <CommissionCard refreshKey={txRefresh} />
          </TabsContent>

          {/* ============================== */}
          {/* Tab : Admin (super_admin only) */}
          {/* ============================== */}
          {isSuperAdmin && (
            <TabsContent value="admin">
              <AdminUsersPanel />
            </TabsContent>
          )}
          </Tabs>
        </motion.div>
      </main>

      <Footer />

      {/* --- Modale création --- */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle clé API</DialogTitle>
            <DialogDescription>
              Fournissez le CLIENT_ID et le CLIENT_SECRET MonCash à associer à
              cette clé. Ces credentials sont chiffrés en base.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de la clé</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
                placeholder="Ma boutique en ligne"
                disabled={creating}
              />
            </div>

            <div>
              <Label className="mb-2 block">Environnement</Label>
              <RadioGroup
                value={createForm.environment}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, environment: v as Environment })
                }
                className="grid grid-cols-2 gap-3"
                disabled={creating}
              >
                <label
                  htmlFor="env-sandbox"
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                    createForm.environment === "sandbox"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="sandbox" id="env-sandbox" className="mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Sandbox</div>
                      <div className="text-xs text-muted-foreground">
                        Tests sans argent réel
                      </div>
                    </div>
                  </div>
                </label>
                <label
                  htmlFor="env-live"
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-colors ${
                    createForm.environment === "live"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="live" id="env-live" className="mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">Live</div>
                      <div className="text-xs text-muted-foreground">
                        Vrais paiements MonCash
                      </div>
                    </div>
                  </div>
                </label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-2">
                {createForm.environment === "sandbox"
                  ? "Utilisez les credentials sandbox que notre équipe vous a transmis."
                  : "Utilisez les credentials live obtenus auprès de Digicel."}
              </p>
            </div>

            <div>
              <Label htmlFor="client_id">CLIENT_ID MonCash</Label>
              <Input
                id="client_id"
                value={createForm.client_id}
                onChange={(e) =>
                  setCreateForm({ ...createForm, client_id: e.target.value })
                }
                placeholder="ex: 23afb346698718a05ee2a65d4d915260"
                disabled={creating}
              />
            </div>

            <div>
              <Label htmlFor="client_secret">CLIENT_SECRET MonCash</Label>
              <Input
                id="client_secret"
                type="password"
                value={createForm.client_secret}
                onChange={(e) =>
                  setCreateForm({ ...createForm, client_secret: e.target.value })
                }
                placeholder="••••••••"
                disabled={creating}
              />
            </div>

            <div>
              <Label htmlFor="redirect_url">
                URL de redirection après paiement{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (optionnel)
                </span>
              </Label>
              <Input
                id="redirect_url"
                type="url"
                value={createForm.redirect_url}
                onChange={(e) =>
                  setCreateForm({ ...createForm, redirect_url: e.target.value })
                }
                placeholder="https://votre-site.com/paiement/succes"
                disabled={creating}
              />
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Page de votre site vers laquelle le client est envoyé après
                avoir réussi son paiement MonCash.{" "}
                <span className="text-muted-foreground">
                  Si vide, notre page de félicitations par défaut est utilisée :{" "}
                  <a
                    href="/paiement/succes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    /paiement/succes
                  </a>
                </span>
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création…
                  </>
                ) : (
                  "Créer la clé"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Modale affichage clé créée (1x) --- */}
      <Dialog
        open={!!createdKey}
        onOpenChange={(o) => !o && setCreatedKey(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Votre nouvelle clé API
            </DialogTitle>
            <DialogDescription>
              <span className="flex items-start gap-2 mt-2 text-destructive">
                <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Cette clé ne sera <strong>plus jamais affichée</strong>.
                  Copiez-la et conservez-la en lieu sûr maintenant.
                </span>
              </span>
            </DialogDescription>
          </DialogHeader>

          {createdKey && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-secondary p-3 flex items-center gap-2 font-mono text-sm break-all">
                <code className="flex-1">{createdKey.key}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyKey}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Utilisez-la dans l'en-tête{" "}
                <code className="bg-secondary px-1.5 py-0.5 rounded">
                  X-API-Key
                </code>{" "}
                de vos requêtes vers <code>/moncash/*</code>.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)} className="w-full">
              J'ai bien copié la clé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Confirmation révocation --- */}
      <AlertDialog
        open={!!toRevoke}
        onOpenChange={(o) => !o && setToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer cette clé ?</AlertDialogTitle>
            <AlertDialogDescription>
              La clé "<strong>{toRevoke?.name}</strong>" cessera immédiatement de
              fonctionner. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onRevoke}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Révocation…
                </>
              ) : (
                "Révoquer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
