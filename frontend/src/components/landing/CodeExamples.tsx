import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// L'URL pointe sur le backend local en dev. En prod, remplacer par l'URL publique.
const API = "http://localhost:8000";

const tabs = [
  {
    label: "JavaScript",
    code: `// Votre clé API SPI, générée dans le tableau de bord.
// Format : "mc_sandbox_..." en test, "mc_live_..." en production.
const API_KEY = 'mc_sandbox_XXXXXXXXXXXXXXXXXXXX';

// Créer un paiement MonCash
const res = await fetch('${API}/moncash/create-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
  body: JSON.stringify({ amount: 500, orderId: 'order-001' })
});

const data = await res.json();

// Rediriger le client vers la page MonCash pour qu'il paie
window.location.href = data.payment_url;`,
  },
  {
    label: "Python",
    code: `import requests

API = '${API}'
API_KEY = 'mc_sandbox_XXXXXXXXXXXXXXXXXXXX'

res = requests.post(
    f'{API}/moncash/create-payment',
    headers={
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
    },
    json={'amount': 500, 'orderId': 'order-001'}
)
data = res.json()

# Rediriger le client vers data['payment_url']
print(data['payment_url'])`,
  },
  {
    label: "PHP",
    code: `<?php
$API = '${API}';
$apiKey = 'mc_sandbox_XXXXXXXXXXXXXXXXXXXX';

$ch = curl_init("$API/moncash/create-payment");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        "X-API-Key: $apiKey",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'amount' => 500,
        'orderId' => 'order-001',
    ]),
]);

$response = json_decode(curl_exec($ch), true);

// Rediriger le client
header('Location: ' . $response['payment_url']);`,
  },
  {
    label: "cURL",
    code: `curl -X POST ${API}/moncash/create-payment \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: mc_sandbox_XXXXXXXXXXXXXXXXXXXX" \\
  -d '{"amount": 500, "orderId": "order-001"}'`,
  },
];

const CodeExamples = () => {
  const [active, setActive] = useState(0);
  const { isAuthenticated } = useAuth();

  return (
    <section id="code-examples" className="py-24 relative">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Intégrez dans <span className="gradient-text-accent">n'importe quel langage</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Une seule clé API SPI dans l'en-tête{" "}
            <code className="bg-secondary px-1.5 py-0.5 rounded text-xs text-foreground">
              X-API-Key
            </code>{" "}
            — copiez, collez, et commencez à accepter les paiements.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
          <div className="flex gap-1 mb-0 border-b border-border">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActive(i)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
                  active === i ? "bg-secondary text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="code-block rounded-t-none p-6 overflow-x-auto">
            <pre className="text-sm leading-relaxed text-slate-200">
              <code>{tabs[active].code}</code>
            </pre>
          </div>

          {/* Note vers le dashboard pour voir tous les endpoints */}
          <div className="mt-6 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-[200px]">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground leading-relaxed">
                Ceci est un aperçu de la création de paiement. Pour voir tous
                les exemples de code pour <strong>tous les endpoints</strong>{" "}
                (récupération de transaction, payout, solde, etc.),{" "}
                <strong>connectez-vous</strong> à votre tableau de bord.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold whitespace-nowrap"
            >
              <Link to={isAuthenticated ? "/tableau-de-bord" : "/connexion"}>
                {isAuthenticated ? "Aller au tableau de bord" : "Se connecter"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CodeExamples;
