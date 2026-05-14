import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCcw,
  RotateCw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApiError, transactionsApi, type Transaction } from "@/lib/api";

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });

const fmtAmount = (amount: number, currency = "HTG") =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${currency}`;

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    successful: "bg-green-100 text-green-700",
    created: "bg-amber-100 text-amber-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    expired: "bg-gray-100 text-gray-600",
  };
  const cls = styles[status] ?? "bg-secondary text-muted-foreground";
  const labels: Record<string, string> = {
    successful: "Réussie",
    created: "En attente",
    pending: "En attente",
    failed: "Échouée",
    expired: "Expirée",
  };
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded ${cls}`}
    >
      {labels[status] ?? status}
    </span>
  );
};

const TypeIcon = ({ type }: { type: string }) =>
  type === "payout" ? (
    <ArrowUpRight className="h-4 w-4 text-orange-600" aria-label="Payout" />
  ) : (
    <ArrowDownLeft className="h-4 w-4 text-green-600" aria-label="Paiement" />
  );

type Filters = {
  status: string;
  type: string;
  env: string;
  q: string;
};

const TransactionsTable = ({ refreshKey }: { refreshKey?: number }) => {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Ids des transactions en cours de vérification chez MonCash */
  const [verifying, setVerifying] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    type: "all",
    env: "all",
    q: "",
  });

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.list({ limit: 200 });
      setItems(data);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Erreur de chargement des transactions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const onVerify = async (tx: Transaction) => {
    setVerifying((s) => new Set(s).add(tx.id));
    try {
      const updated = await transactionsApi.refreshStatus(tx.id);
      setItems((arr) => arr.map((t) => (t.id === updated.id ? updated : t)));
      if (updated.status === "successful") {
        toast.success("Paiement confirmé par MonCash !");
      } else if (updated.status === "failed") {
        toast.error("MonCash signale que le paiement a échoué.");
      } else {
        toast("Paiement en attente — MonCash ne confirme pas encore.", {
          description:
            "Réessayez après que l'utilisateur ait terminé sur la page MonCash.",
        });
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erreur de vérification.";
      toast.error(msg);
    } finally {
      setVerifying((s) => {
        const next = new Set(s);
        next.delete(tx.id);
        return next;
      });
    }
  };

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (filters.status !== "all" && t.status !== filters.status) return false;
      if (filters.type !== "all" && t.transaction_type !== filters.type) return false;
      if (filters.env !== "all" && t.environment !== filters.env) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const inOrder = (t.order_id ?? "").toLowerCase().includes(q);
        const inTx = (t.transaction_id ?? "").toLowerCase().includes(q);
        const inDesc = (t.description ?? "").toLowerCase().includes(q);
        if (!inOrder && !inTx && !inDesc) return false;
      }
      return true;
    });
  }, [items, filters]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const success = items.filter((t) => t.status === "successful").length;
    const failed = items.filter((t) => t.status === "failed").length;
    const totalAmount = items
      .filter((t) => t.status === "successful")
      .reduce((sum, t) => sum + t.amount, 0);
    return { total, success, failed, totalAmount };
  }, [items]);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            Historique de tous vos paiements et payouts MonCash.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Rafraîchir
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total" value={String(stats.total)} icon={<Wallet className="h-4 w-4" />} />
        <KpiCard
          label="Réussies"
          value={String(stats.success)}
          icon={<ArrowDownLeft className="h-4 w-4 text-green-600" />}
        />
        <KpiCard
          label="Échouées"
          value={String(stats.failed)}
          icon={<AlertCircle className="h-4 w-4 text-destructive" />}
        />
        <KpiCard
          label="Volume réussi"
          value={fmtAmount(stats.totalAmount)}
          icon={<Wallet className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filtres :
        </div>
        <Select
          value={filters.status}
          onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="successful">Réussies</SelectItem>
            <SelectItem value="created">En attente</SelectItem>
            <SelectItem value="failed">Échouées</SelectItem>
            <SelectItem value="expired">Expirées</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.type}
          onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="payment">Paiements</SelectItem>
            <SelectItem value="payout">Payouts</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.env}
          onValueChange={(v) => setFilters((f) => ({ ...f, env: v }))}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Env." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous env.</SelectItem>
            <SelectItem value="sandbox">Sandbox</SelectItem>
            <SelectItem value="live">Live</SelectItem>
          </SelectContent>
        </Select>

        <Input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Rechercher (order, transaction…)"
          className="h-8 text-xs max-w-xs"
        />
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement…
        </div>
      ) : error ? (
        <div className="py-8 flex items-start gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          {items.length === 0
            ? "Aucune transaction pour le moment. Lancez un paiement dans la section ci-dessus."
            : "Aucune transaction ne correspond aux filtres."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Env.</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <TypeIcon type={t.transaction_type} />
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{t.order_id ?? "—"}</code>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">
                      {t.transaction_id ?? t.payment_token?.slice(0, 14) + "…" ?? "—"}
                    </code>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {fmtAmount(t.amount, t.currency)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {t.environment ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDateTime(t.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider delayDuration={150}>
                      <div className="flex items-center justify-end gap-1">
                        {t.payment_url && t.status === "created" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild variant="ghost" size="sm">
                                <a
                                  href={t.payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Ouvrir la page de paiement"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Ouvrir la page de paiement MonCash
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {t.status === "created" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onVerify(t)}
                                disabled={verifying.has(t.id)}
                                aria-label="Vérifier le statut auprès de MonCash"
                              >
                                {verifying.has(t.id) ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RotateCw className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Vérifier le statut chez MonCash
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-background/50 p-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-xl font-bold text-foreground">{value}</div>
  </div>
);

export default TransactionsTable;
