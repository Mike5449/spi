import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Lock, Zap, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

const codeLines = [
  'POST http://localhost:8000/moncash/create-payment',
  'X-API-Key: mc_sandbox_xxxxxxxxxxxxxxxxxxxx',
  '',
  '{',
  '  "amount": 500,',
  '  "orderId": "order-001"',
  '}',
];

const Hero = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleLines((prev) => (prev < codeLines.length ? prev + 1 : prev));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="relative min-h-screen pt-24 pb-16 overflow-hidden dot-pattern">
      {/* Halos rouges */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[100px] animate-pulse-glow" />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Gauche */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Acceptez les paiements <span className="gradient-text">MonCash</span>{" "}
              <span className="gradient-text-accent">en quelques minutes</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              L'API la plus simple pour intégrer MonCash — le moyen de paiement mobile n°1 en Haïti — dans n'importe quelle application ou site web. Pas de configuration complexe, juste une clé API.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 glow-accent text-base px-8">
                <Link to="/inscription">Obtenir votre clé API <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary text-base px-8">
                <a href="#code-examples"><BookOpen className="mr-2 h-4 w-4" /> Voir la doc</a>
              </Button>
            </div>

            {/* Badges de confiance */}
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: Lock, label: "Chiffré" },
                { icon: Zap, label: "Sandbox & Production" },
                { icon: Flag, label: "Conçu pour Haïti" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Droite — Extrait de code */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="relative"
          >
            <div className="code-block p-6 rounded-xl glow-primary">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-3 w-3 rounded-full bg-red-500/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-500/70" />
                <span className="ml-2 text-xs text-slate-400">Requête API</span>
              </div>
              <pre className="text-sm leading-relaxed">
                {codeLines.map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={i < visibleLines ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <span
                      className={
                        i === 0
                          ? "text-green-400"
                          : i === 1
                          ? "text-red-400"
                          : "text-slate-200"
                      }
                    >
                      {line}
                    </span>
                  </motion.div>
                ))}
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
