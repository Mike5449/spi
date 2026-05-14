import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Gratuit",
    price: "0 $",
    period: "/mois",
    desc: "Sandbox uniquement",
    features: ["Tests en sandbox uniquement", "100 transactions de test / mois", "Support communautaire"],
    cta: "Commencer gratuitement",
    popular: false,
    accent: false,
  },
  {
    name: "Starter",
    price: "9 $",
    period: "/mois",
    desc: "Le plus populaire",
    features: ["Sandbox + Production", "1 000 transactions / mois", "Clé API + documentation complète", "Support par e-mail"],
    cta: "Obtenir une clé API",
    popular: true,
    accent: true,
  },
  {
    name: "Pro",
    price: "29 $",
    period: "/mois",
    desc: "Pour passer à l'échelle",
    features: ["Transactions illimitées", "Support prioritaire", "Support des webhooks", "Plusieurs clés API"],
    cta: "Passer Pro",
    popular: false,
    accent: false,
  },
];

const Pricing = () => (
  <section id="pricing" className="py-24 relative">
    <div className="container mx-auto px-4 md:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Des tarifs simples et <span className="gradient-text-accent">transparents</span>
        </h2>
        <p className="mt-4 text-muted-foreground">Commencez gratuitement, montez en gamme quand vous êtes prêt</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card rounded-xl p-8 relative hover-lift ${plan.popular ? "ring-2 ring-accent" : ""}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">
                Le plus populaire
              </div>
            )}
            <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
            <div className="mt-6 mb-6">
              <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
              <span className="text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className={`w-full font-semibold ${
                plan.accent
                  ? "bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {plan.cta}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;
