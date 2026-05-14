import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Ai-je besoin d'un compte MonCash ?",
    a: "Oui. Vous avez besoin d'un compte marchand MonCash auprès de Digicel pour obtenir votre CLIENT_ID et CLIENT_SECRET. Notre plateforme gère la couche API.",
  },
  {
    q: "Quelle est la différence entre Sandbox et Production ?",
    a: "Le Sandbox vous permet de tester les paiements sans argent réel. Passez en Production lorsque vous êtes prêt à accepter de vrais paiements MonCash.",
  },
  {
    q: "Mon CLIENT_SECRET est-il en sécurité ?",
    a: "Oui. Tous les identifiants sont chiffrés via AES-256 avant d'être stockés. Nous ne les affichons jamais après l'inscription.",
  },
  {
    q: "Puis-je récupérer ma clé API si je la perds ?",
    a: "Oui. Utilisez l'endpoint /moncash/recover-api-key avec vos identifiants MonCash pour récupérer votre clé API à tout moment.",
  },
  {
    q: "Quels langages sont supportés ?",
    a: "Tout langage capable de faire des requêtes HTTP — JavaScript, Python, PHP, Java, Swift, etc.",
  },
];

const FAQ = () => (
  <section id="faq" className="py-24">
    <div className="container mx-auto px-4 md:px-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold">
          Questions <span className="gradient-text">fréquentes</span>
        </h2>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass-card rounded-xl px-6 border-none">
              <AccordionTrigger className="text-foreground text-left font-medium hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQ;
