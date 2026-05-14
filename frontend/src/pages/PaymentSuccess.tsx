import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Heart,
  Rocket,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Page de redirection par défaut après un paiement MonCash réussi.
 * Utilisée lorsque l'utilisateur n'a pas configuré sa propre `redirect_url`
 * sur sa clé API.
 *
 * Accepte des query params optionnels que MonCash peut transmettre :
 *   ?transactionId=... &orderId=... &amount=...
 */
const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const transactionId = params.get("transactionId");
  const orderId = params.get("orderId");
  const amount = params.get("amount");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 dot-pattern">
      <Link
        to="/"
        className="flex items-center gap-2 mb-8"
        aria-label="SPI — Accueil"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-bold text-foreground">SPI</span>
          <span className="text-[10px] text-muted-foreground -mt-0.5">
            Système de Paiement Intégré
          </span>
        </div>
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl glass-card rounded-2xl p-8 sm:p-10 border border-border shadow-lg text-center"
      >
        {/* Coche de succès */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
        >
          <CheckCircle2 className="h-12 w-12 text-green-600" strokeWidth={2.5} />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
          Félicitations !
        </h1>

        <p className="text-lg text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
          Vous avez effectué avec succès un paiement avec l'API{" "}
          <span className="gradient-text font-bold">SPI</span>.
        </p>

        {/* Détails de la transaction si MonCash les transmet en query params */}
        {(orderId || transactionId || amount) && (
          <div className="rounded-lg border border-border bg-secondary/50 p-4 mb-6 text-left max-w-sm mx-auto space-y-1.5">
            {amount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-medium text-foreground">{amount} HTG</span>
              </div>
            )}
            {orderId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commande</span>
                <code className="text-foreground text-xs">{orderId}</code>
              </div>
            )}
            {transactionId && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction</span>
                <code className="text-foreground text-xs">{transactionId}</code>
              </div>
            )}
          </div>
        )}

        {/* Encadré "Prêt pour la production" */}
        <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-5 mb-6 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Rocket className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-2">
                Vous êtes prêt à passer en production
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vous venez de tester avec succès en mode{" "}
                <strong className="text-foreground">sandbox</strong>. Pour aller
                en production, fournissez à{" "}
                <strong className="text-foreground">Digicel</strong> une vraie
                URL de redirection de votre site web — celle vers laquelle vos
                clients seront renvoyés après leur paiement réel. Vous pourrez
                ensuite l'enregistrer sur votre clé API <em>live</em> depuis
                votre tableau de bord SPI.
              </p>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-3 -ml-2 text-primary hover:text-primary hover:bg-primary/10"
              >
                <a
                  href="https://moncashbutton.digicelgroup.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Portail MonCash Digicel
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground italic flex items-center justify-center gap-1.5 mb-8">
          Merci d'avoir choisi SPI
          <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold"
          >
            <Link to="/tableau-de-bord">
              Aller au tableau de bord
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </motion.div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-md">
        Page de confirmation par défaut affichée quand votre clé API n'a pas
        d'URL de redirection personnalisée.
      </p>
    </div>
  );
};

export default PaymentSuccess;
