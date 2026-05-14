import { motion } from "framer-motion";
import { Code2, FileSignature, FlaskConical, Rocket } from "lucide-react";

type Step = {
  icon: typeof Code2;
  title: string;
  /** Description longue, peut contenir des éléments JSX */
  body: React.ReactNode;
};

const steps: Step[] = [
  {
    icon: FlaskConical,
    title: "Obtenez vos identifiants MonCash",
    body: (
      <>
        <div className="rounded-md border border-border bg-secondary/40 p-3 mb-3 text-left">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
            Mode test (sandbox)
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Une fois inscrit sur SPI, notre équipe vous envoie vos{" "}
            <code className="text-foreground">MONCASH_CLIENT_ID</code> et{" "}
            <code className="text-foreground">MONCASH_CLIENT_SECRET</code> sous{" "}
            <strong className="text-foreground">24 heures</strong> par e-mail ou
            WhatsApp.
          </p>
        </div>
        <div className="rounded-md border border-border bg-secondary/40 p-3 text-left">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
            Mode production (live)
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vos identifiants sont fournis directement par{" "}
            <strong className="text-foreground">Digicel</strong> après
            inscription de votre entreprise sur le portail MonCash Business.
          </p>
        </div>
      </>
    ),
  },
  {
    icon: FileSignature,
    title: "Recevez une proposition personnalisée",
    body: (
      <p className="text-sm text-muted-foreground leading-relaxed">
        Nous vous envoyons une <strong className="text-foreground">proposition claire</strong> avec
        délais et tarifs, adaptée à votre volume et à votre cas d'usage. Une
        fois acceptée, vous saisissez vos credentials MonCash dans votre
        espace SPI et recevez instantanément votre clé API personnelle.
        Vos credentials sont chiffrés (AES) et jamais réaffichés.
      </p>
    ),
  },
  {
    icon: Rocket,
    title: "Intégrez en quelques minutes",
    body: (
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ajoutez un seul en-tête à vos requêtes HTTP&nbsp;:{" "}
        <code className="text-foreground bg-secondary px-1 py-0.5 rounded">
          X-API-Key
        </code>
        . Copiez nos exemples de code (JS, Python, PHP, cURL) et passez en
        production dès aujourd'hui.
      </p>
    ),
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 relative">
    <div className="container mx-auto px-4 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl sm:text-4xl font-bold">
          Comment ça <span className="gradient-text">marche</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Trois étapes simples pour commencer à accepter MonCash via SPI
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass-card rounded-xl p-8 hover-lift flex flex-col"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <step.icon className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
              Étape {i + 1}
            </div>
            <h3 className="text-center text-lg font-semibold text-foreground mb-4">
              {step.title}
            </h3>
            <div className="flex-1">{step.body}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
