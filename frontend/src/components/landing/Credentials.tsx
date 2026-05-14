import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink } from "lucide-react";

const productionSteps = [
  "Contactez Digicel Haïti pour démarrer la procédure d'enregistrement — toute la procédure d'inscription et d'approbation est gérée par eux.",
  "Pendant la procédure, vous devrez fournir : votre e-mail, l'URL de votre site web, votre Return URL et votre Alert URL.",
  "Une fois approuvé, Digicel vous remet les identifiants d'accès à leur portail.",
  "Sur leur portail, vous récupérez vos MONCASH_CLIENT_ID et MONCASH_CLIENT_SECRET, puis vous les saisissez dans SPI pour obtenir votre clé API.",
];

const Credentials = () => (
  <section id="credentials" className="py-24">
    <div className="container mx-auto px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto glass-card rounded-xl p-8 border-l-4 border-l-accent"
      >
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-accent" />
          <h3 className="text-xl font-bold text-foreground">
            Avant de commencer — Obtenez vos identifiants MonCash
          </h3>
        </div>

        <p className="text-muted-foreground leading-relaxed mb-6">
          SPI fournit <strong className="text-foreground">uniquement</strong>{" "}
          les identifiants pour <strong className="text-foreground">tester</strong>{" "}
          (sandbox). Pour passer en production, vos MONCASH_CLIENT_ID et
          MONCASH_CLIENT_SECRET doivent être obtenus directement auprès de
          Digicel Haïti.
        </p>

        <div className="rounded-lg border border-border bg-secondary/40 p-4 mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
            Procédure pour la production (gérée par Digicel)
          </div>
          <ol className="space-y-3 text-sm text-muted-foreground">
            {productionSteps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <a
            href="https://sandbox.moncashbutton.digicelgroup.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            Portail Sandbox <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href="https://moncashbutton.digicelgroup.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-accent hover:underline"
          >
            Portail Production <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

export default Credentials;
