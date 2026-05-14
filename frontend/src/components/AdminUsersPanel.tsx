import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Eye,
  Loader2,
  Pencil,
  RefreshCcw,
  Search,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminApi,
  ApiError,
  type Transaction,
  type UserDetailAdmin,
  type UserListAdminItem,
} from "@/lib/api";

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR") : "—";

const AdminUsersPanel = () => {
  const [users, setUsers] = useState<UserListAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Édition commission
  const [editing, setEditing] = useState<UserListAdminItem | null>(null);
  const [editRate, setEditRate] = useState("");
  const [saving, setSaving] = useState(false);

  // Détail utilisateur
  const [detailUser, setDetailUser] = useState<UserDetailAdmin | null>(null);
  const [detailTx, setDetailTx] = useState<Transaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await adminApi.listUsers());
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Erreur de chargement des utilisateurs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const onSaveCommission = async () => {
    if (!editing) return;
    const rate = parseFloat(editRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Le taux doit être un nombre entre 0 et 100.");
      return;
    }
    setSaving(true);
    try {
      const updated = await adminApi.setCommission(editing.id, rate);
      toast.success(`Taux mis à jour pour ${updated.username}.`);
      setUsers((arr) =>
        arr.map((u) =>
          u.id === updated.id ? { ...u, commission_rate: updated.commission_rate } : u
        )
      );
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const onOpenDetail = async (u: UserListAdminItem) => {
    setDetailLoading(true);
    try {
      const [d, tx] = await Promise.all([
        adminApi.getUser(u.id),
        adminApi.userTransactions(u.id, { limit: 50 }),
      ]);
      setDetailUser(d);
      setDetailTx(tx);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Erreur de chargement du détail.");
    } finally {
      setDetailLoading(false);
    }
  };

  // KPIs globaux
  const kpis = useMemo(() => {
    return users.reduce(
      (acc, u) => {
        acc.totalUsers += 1;
        if (u.role === "super_admin") acc.totalAdmins += 1;
        acc.totalOwed += u.total_commission_owed;
        acc.totalVolume += u.total_volume_successful;
        acc.totalKeys += u.api_keys_count;
        acc.totalSuccess += u.successful_transactions_count;
        return acc;
      },
      {
        totalUsers: 0,
        totalAdmins: 0,
        totalOwed: 0,
        totalVolume: 0,
        totalKeys: 0,
        totalSuccess: 0,
      }
    );
  }, [users]);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Administration des utilisateurs
          </h2>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de tous les comptes. Ajustez les taux de commission
            individuellement.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Rafraîchir
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <Kpi label="Utilisateurs" value={String(kpis.totalUsers)} icon={<Users className="h-4 w-4" />} />
        <Kpi
          label="Administrateurs"
          value={String(kpis.totalAdmins)}
          icon={<Shield className="h-4 w-4 text-primary" />}
        />
        <Kpi label="Clés API" value={String(kpis.totalKeys)} />
        <Kpi label="Transactions réussies" value={String(kpis.totalSuccess)} />
        <Kpi
          label="Total commission dû"
          value={`${fmt(kpis.totalOwed)} HTG`}
          highlight
        />
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher username, email, rôle…"
          className="max-w-xs h-9"
        />
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : error ? (
        <div className="py-6 flex items-start gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          Aucun utilisateur ne correspond.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead className="text-right">Total dû</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Tx ✓</TableHead>
                <TableHead className="text-right">Clés</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs text-muted-foreground">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-xs">
                    {u.phone ? (
                      <a
                        href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        title="Ouvrir WhatsApp"
                      >
                        {u.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        u.role === "super_admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {u.role === "super_admin" ? "super admin" : u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {fmt(u.commission_rate)}%
                  </TableCell>
                  <TableCell className="text-right font-medium text-primary">
                    {fmt(u.total_commission_owed)}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {fmt(u.total_volume_successful)}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {u.successful_transactions_count}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    <span className="text-foreground">{u.active_api_keys_count}</span>
                    <span className="text-muted-foreground"> / {u.api_keys_count}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDetail(u)}
                        aria-label="Voir les détails"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(u);
                          setEditRate(String(u.commission_rate));
                        }}
                        aria-label="Modifier le taux"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* --- Modale édition commission --- */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le taux de commission</DialogTitle>
            <DialogDescription>
              Utilisateur :{" "}
              <strong className="text-foreground">{editing?.username}</strong>{" "}
              (id&nbsp;{editing?.id})
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="commission-rate">Nouveau taux (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={editRate}
              onChange={(e) => setEditRate(e.target.value)}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Le nouveau taux s'applique aux <strong>futures</strong> transactions
              qui passent à "réussie". Les transactions déjà confirmées gardent leur
              taux d'origine.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={onSaveCommission}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Modale détail utilisateur --- */}
      <Dialog
        open={!!detailUser || detailLoading}
        onOpenChange={(o) => {
          if (!o) {
            setDetailUser(null);
            setDetailTx([]);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails utilisateur — {detailUser?.username ?? "…"}
            </DialogTitle>
            <DialogDescription>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
                <span>{detailUser?.email}</span>
                {detailUser?.phone && (
                  <a
                    href={`https://wa.me/${detailUser.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    📱 {detailUser.phone}
                  </a>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement…
            </div>
          ) : !detailUser ? null : (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Kpi label="Rôle" value={detailUser.role} />
                <Kpi label="Taux" value={`${fmt(detailUser.commission_rate)}%`} />
                <Kpi
                  label="Total dû"
                  value={`${fmt(detailUser.total_commission_owed)} HTG`}
                  highlight
                />
                <Kpi
                  label="Volume réussi"
                  value={`${fmt(detailUser.total_volume_successful)} HTG`}
                />
                <Kpi label="Tx réussies" value={String(detailUser.successful_transactions_count)} />
                <Kpi label="Tx échouées" value={String(detailUser.failed_transactions_count)} />
                <Kpi label="Tx en attente" value={String(detailUser.pending_transactions_count)} />
                <Kpi
                  label="Clés API"
                  value={`${detailUser.active_api_keys_count} / ${detailUser.api_keys_count}`}
                />
              </div>

              {/* Clés API */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">
                  Clés API ({detailUser.api_keys.length})
                </h3>
                {detailUser.api_keys.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune clé.</p>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Préfixe</TableHead>
                          <TableHead>Env</TableHead>
                          <TableHead>Redirection</TableHead>
                          <TableHead>Créée le</TableHead>
                          <TableHead>État</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailUser.api_keys.map((k) => (
                          <TableRow key={k.id}>
                            <TableCell className="text-sm">{k.name}</TableCell>
                            <TableCell>
                              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                                {k.key_prefix}…
                              </code>
                            </TableCell>
                            <TableCell className="text-xs">{k.environment}</TableCell>
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
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtDate(k.created_at)}
                            </TableCell>
                            <TableCell>
                              {k.is_active ? (
                                <span className="text-xs text-green-700">Active</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Révoquée</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Transactions récentes */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-2">
                  Transactions récentes ({detailTx.length})
                </h3>
                {detailTx.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucune transaction.</p>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailTx.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>
                              <code className="text-xs">{t.order_id ?? "—"}</code>
                            </TableCell>
                            <TableCell className="text-right text-xs font-medium">
                              {fmt(t.amount)} {t.currency}
                            </TableCell>
                            <TableCell className="text-right text-xs text-primary">
                              {t.commission_amount != null
                                ? `${fmt(t.commission_amount)} (${fmt(t.commission_rate ?? 0)}%)`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">{t.status}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {fmtDate(t.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailUser(null)} variant="outline">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Kpi = ({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-lg p-3 ${
      highlight
        ? "border-2 border-primary/40 bg-primary/5"
        : "border border-border bg-background/50"
    }`}
  >
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
      {icon}
      <span>{label}</span>
    </div>
    <div className={`text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`}>
      {value}
    </div>
  </div>
);

export default AdminUsersPanel;
