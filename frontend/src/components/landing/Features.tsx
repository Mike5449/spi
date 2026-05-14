import { motion } from "framer-motion";
import { ShieldCheck, Zap, KeyRound, Package, Flag, FileText } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Chiffrement de niveau bancaire", desc: "Vos identifiants MonCash sont chiffrés au repos avec Fernet AES" },
  { icon: Zap, title: "Sandbox & Production", desc: "Testez en sandbox MonCash avant de passer en production" },
  { icon: KeyRound, title: "Récupération de clé API", desc: "Clé perdue ? Récupérez-la à tout moment avec vos identifiants MonCash" },
  { icon: Package, title: "API REST simple", desc: "API JSON standard compatible avec tout langage ou framework" },
  { icon: Flag, title: "Conçue pour Haïti", desc: "Optimisée pour MonCash, le moyen de paiement le plus utilisé en Haïti" },
  { icon: FileText, title: "Documentation complète", desc: "Guides d'intégration pour JavaScript, Python, PHP et plus" },
];

const Features = () => (
  <section id="features" className="py-24 relative">
    <div className="container mx-auto px-4 md:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Tout ce qu'il vous <span className="gradient-text">faut</span>
        </h2>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Pensé autour de la sécurité et de la simplicité</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-6 hover-lift group"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <f.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
