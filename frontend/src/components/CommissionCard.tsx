import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Percent, RefreshCcw, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError, usersApi, type CommissionSummary } from "@/lib/api";

const fmt = (v: number) =>
  v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CommissionCard = ({ refreshKey }: { refreshKey?: number }) => {
  const [data, setData] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await usersApi.commissionSummary());
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Erreur de chargement du résumé."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Commission plateforme
          </h2>
          <p className="text-sm text-muted-foreground">
            Montant total que vous devez régler à SPI pour vos
            transactions réussies.
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

      {loading ? (
        <div className="py-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement…
        </div>
      ) : error ? (
        <div className="py-4 flex items-start gap-3 text-destructive">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : !data ? null : (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Percent className="h-4 w-4 text-primary" />
              Votre taux
            </div>
            <div className="text-2xl font-bold text-foreground">
              {fmt(data.commission_rate)}%
            </div>
          </div>

          <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wallet className="h-4 w-4 text-primary" />
              Total dû
            </div>
            <div className="text-2xl font-bold text-primary">
              {fmt(data.total_commission_owed)} HTG
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              sur {data.successful_transactions_count} transactions réussies
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              Volume traité
            </div>
            <div className="text-2xl font-bold text-foreground">
              {fmt(data.total_volume)} HTG
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        Le taux est fixé par l'administrateur de la plateforme et peut être
        différent pour chaque utilisateur. Il est verrouillé au moment où une
        transaction passe à <em>réussie</em> — modifier le taux n'affecte pas
        les transactions passées.
      </p>
    </div>
  );
};

export default CommissionCard;
