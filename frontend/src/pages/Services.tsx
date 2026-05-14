import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Code, Globe, Headphones, Rocket, Shield, Users, MessageCircle, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

/** Numéro WhatsApp de contact SPI (sans espaces, sans +) */
const WHATSAPP_NUMBER = "50934705170";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const services = [
  {
    icon: Globe,
    title: "Création de site web",
    desc: "Nous créons votre site vitrine ou e-commerce avec le paiement MonCash intégré, clé en main.",
  },
  {
    icon: Code,
    title: "Développement d'application",
    desc: "Application mobile ou web sur mesure avec MonCash comme méthode de paiement principale.",
  },
  {
    icon: Rocket,
    title: "Intégration MonCash",
    desc: "Vous avez déjà un site ou une app ? On s'occupe d'y ajouter MonCash pour vous.",
  },
  {
    icon: Shield,
    title: "Sécurité & Conformité",
    desc: "Intégration sécurisée avec chiffrement de vos données et bonnes pratiques de sécurité.",
  },
  {
    icon: Headphones,
    title: "Support dédié",
    desc: "Un accompagnement personnalisé du début à la fin de votre projet, avec support continu.",
  },
  {
    icon: Users,
    title: "Formation & Documentation",
    desc: "On vous forme à gérer vos paiements et on vous fournit toute la documentation nécessaire.",
  },
];

const steps = [
  { num: "01", title: "Contactez-nous", desc: "Décrivez votre projet et vos besoins. C'est gratuit et sans engagement." },
  { num: "02", title: "Devis personnalisé", desc: "On vous envoie une proposition claire avec délais et tarifs." },
  { num: "03", title: "Développement", desc: "Notre équipe développe et intègre MonCash dans votre solution." },
  { num: "04", title: "Lancement", desc: "Tests, mise en production et accompagnement post-lancement." },
];

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  description: string;
};

const initialForm: ContactForm = {
  name: "",
  email: "",
  phone: "",
  projectType: "",
  description: "",
};

const validateForm = (form: ContactForm): string | null => {
  if (!form.name.trim()) return "Le nom complet est requis.";
  if (!form.phone.trim()) return "Le téléphone est requis.";
  if (!form.projectType) return "Choisissez un type de projet.";
  if (!form.description.trim()) return "Décrivez votre projet.";
  return null;
};

const buildWhatsAppMessage = (form: ContactForm): string => {
  const lines = [
    "Bonjour SPI 👋",
    "",
    `*Nom :* ${form.name}`,
    `*Téléphone :* ${form.phone}`,
  ];
  if (form.email.trim()) {
    lines.push(`*E-mail :* ${form.email}`);
  }
  lines.push(`*Type de projet :* ${form.projectType}`);
  lines.push("", "*Description :*", form.description);
  return lines.join("\n");
};

const Services = () => {
  const [form, setForm] = useState<ContactForm>(initialForm);

  const update = <K extends keyof ContactForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    // Ici, plus tard, on enverra le formulaire par e-mail vers le backend.
    toast.success("Demande envoyée. Nous vous recontactons sous 24h.");
  };

  const sendViaWhatsApp = () => {
    const err = validateForm(form);
    if (err) {
      toast.error(err);
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(form))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
  <div className="min-h-screen">
    <Navbar />

    {/* Hero */}
    <section id="accueil" className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-sm text-muted-foreground mb-6">
            <MessageCircle className="h-4 w-4 text-accent" />
            Pas développeur ? Pas de problème.
          </span>
        </motion.div>

        <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1} className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          On s'occupe de{" "}
          <span className="gradient-text-accent">tout pour vous</span>
        </motion.h1>

        <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Vous voulez accepter les paiements MonCash mais vous n'avez pas d'équipe technique ?
          Notre équipe développe et intègre la solution complète pour vous.
        </motion.p>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-accent text-accent-foreground font-semibold hover:bg-accent/90 glow-accent text-base px-8">
            <a href="#contact">
              Contactez-nous <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base px-8">
            <a href="#services">Voir nos services</a>
          </Button>
        </motion.div>
      </div>
    </section>

    {/* Services */}
    <section id="services" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Nos <span className="gradient-text">services</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Tout ce qu'il faut pour lancer votre activité en ligne avec MonCash.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="glass-card rounded-xl p-6 hover-lift"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Process */}
    <section id="processus" className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comment ça <span className="gradient-text-accent">marche</span> ?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Un processus simple en 4 étapes pour digitaliser vos paiements.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              className="text-center"
            >
              <div className="text-5xl font-black gradient-text-accent mb-4">{s.num}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Contact */}
    <section id="contact" className="py-20 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Parlons de votre <span className="gradient-text">projet</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Décrivez-nous ce que vous souhaitez réaliser. Notre équipe vous répondra sous 24h avec une proposition personnalisée.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-5 w-5 text-primary" />
                <span>+509 XX XX XXXX</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-5 w-5 text-primary" />
                <span>contact@moncashgateway.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>WhatsApp disponible</span>
              </div>
            </div>
          </motion.div>

          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="glass-card rounded-xl p-6 space-y-4"
            onSubmit={onSubmitForm}
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nom complet <span className="text-destructive">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={update("name")}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Jean Baptiste"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  E-mail{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (optionnel)
                  </span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="jean@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Téléphone <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+509 ..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Type de projet <span className="text-destructive">*</span>
              </label>
              <select
                required
                value={form.projectType}
                onChange={update("projectType")}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="" disabled>
                  Choisir...
                </option>
                <option>Utiliser SPI en mode Test (sandbox)</option>
                <option>Site web avec paiement MonCash</option>
                <option>Application mobile</option>
                <option>Intégration MonCash sur site existant</option>
                <option>Boutique en ligne / E-commerce</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Décrivez votre projet <span className="text-destructive">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={update("description")}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Ex: Je veux un site pour vendre mes produits et accepter les paiements via MonCash..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground font-semibold hover:bg-accent/90 glow-accent"
              >
                Envoyer ma demande <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={sendViaWhatsApp}
                className="w-full font-semibold text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Envoyer par WhatsApp
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center -mt-1">
              Le bouton WhatsApp ouvre une conversation avec notre équipe au{" "}
              <strong className="text-foreground">+509 34 70 5170</strong> avec
              votre message déjà pré-rempli.
            </p>
          </motion.form>
        </div>
      </div>
    </section>

    <Footer />
  </div>
  );
};

export default Services;
