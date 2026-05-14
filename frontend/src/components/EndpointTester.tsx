import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Play,
  ServerCrash,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, API_URL, moncashApi, type ApiKey } from "@/lib/api";

// -----------------------------------------------------------------------------
// Schéma des endpoints
// -----------------------------------------------------------------------------

type FieldType = "string" | "number";

type Field = {
  name: string;
  /** Nom utilisé dans le body / la query string (si différent de `name`) */
  apiName?: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  sample?: string | number; // valeur d'exemple utilisée dans les snippets de code
};

/** Endpoint à tester (et à documenter). */
type EndpointDef = {
  id: string;
  method: "GET" | "POST";
  path: string;
  label: string;
  description: string;
  /** Comment les paramètres sont envoyés au backend */
  paramsIn: "body" | "query" | "none";
  fields: Field[];
  execute: (apiKey: string, values: Record<string, string>) => Promise<unknown>;
};

const ENDPOINTS: EndpointDef[] = [
  {
    id: "create-payment",
    method: "POST",
    path: "/moncash/create-payment",
    label: "Créer un paiement",
    description:
      "Génère une URL de paiement MonCash que vous redirigez le client vers.",
    paramsIn: "body",
    fields: [
      { name: "amount", label: "Montant (HTG)", type: "number", placeholder: "500", sample: 500 },
      { name: "orderId", label: "ID commande", type: "string", placeholder: "order-001", sample: "order-001" },
    ],
    execute: (apiKey, v) =>
      moncashApi.createPayment(apiKey, Number(v.amount), v.orderId),
  },
  {
    id: "retrieve-transaction",
    method: "POST",
    path: "/moncash/retrieve-transaction-payment",
    label: "Détails d'une transaction",
    description: "Récupère les détails d'un paiement à partir de son transaction_id.",
    paramsIn: "query",
    fields: [
      {
        name: "transactionId",
        apiName: "transaction_id",
        label: "Transaction ID",
        type: "string",
        placeholder: "12345",
        sample: "12345",
      },
    ],
    execute: (apiKey, v) => moncashApi.retrieveTransaction(apiKey, v.transactionId),
  },
  {
    id: "retrieve-order",
    method: "POST",
    path: "/moncash/retrieve-order-payment",
    label: "Détails d'une commande",
    description: "Récupère les détails d'un paiement à partir de son order_id.",
    paramsIn: "query",
    fields: [
      {
        name: "orderId",
        apiName: "order_id",
        label: "Order ID",
        type: "string",
        placeholder: "order-001",
        sample: "order-001",
      },
    ],
    execute: (apiKey, v) => moncashApi.retrieveOrder(apiKey, v.orderId),
  },
  {
    id: "customer-status",
    method: "POST",
    path: "/moncash/customer-status",
    label: "Statut d'un client",
    description: "Indique si le compte MonCash existe et son statut.",
    paramsIn: "body",
    fields: [
      {
        name: "account",
        label: "N° de téléphone MonCash",
        type: "string",
        placeholder: "509XXXXXXXX",
        sample: "50931907523",
      },
    ],
    execute: (apiKey, v) => moncashApi.customerStatus(apiKey, v.account),
  },
  {
    id: "transfer",
    method: "POST",
    path: "/moncash/transfert",
    label: "Effectuer un payout (transfert)",
    description: "Transfère de l'argent depuis votre solde prefunded vers un compte.",
    paramsIn: "body",
    fields: [
      { name: "amount", label: "Montant (HTG)", type: "number", placeholder: "250", sample: 250 },
      {
        name: "receiver",
        label: "Destinataire (téléphone)",
        type: "string",
        placeholder: "509XXXXXXXX",
        sample: "50931907523",
      },
      { name: "desc", label: "Description", type: "string", placeholder: "Remboursement", sample: "Remboursement commande" },
      {
        name: "reference",
        label: "Référence interne",
        type: "string",
        placeholder: "ref-001",
        sample: "ref-001",
      },
    ],
    execute: (apiKey, v) =>
      moncashApi.transfer(apiKey, {
        amount: Number(v.amount),
        receiver: v.receiver,
        desc: v.desc,
        reference: v.reference,
      }),
  },
  {
    id: "prefunded-status",
    method: "POST",
    path: "/moncash/prefunded-transaction-status",
    label: "Statut d'un transfert prefunded",
    description: "Vérifie le statut d'un transfert effectué précédemment.",
    paramsIn: "body",
    fields: [
      {
        name: "reference",
        label: "Référence",
        type: "string",
        placeholder: "ref-001",
        sample: "ref-001",
      },
    ],
    execute: (apiKey, v) => moncashApi.prefundedStatus(apiKey, v.reference),
  },
  {
    id: "prefunded-balance",
    method: "GET",
    path: "/moncash/prefunded-balance",
    label: "Solde prefunded",
    description: "Retourne le solde MonCash disponible pour les transferts.",
    paramsIn: "none",
    fields: [],
    execute: (apiKey) => moncashApi.prefundedBalance(apiKey),
  },
];

// -----------------------------------------------------------------------------
// Générateurs de snippets multi-langages
// -----------------------------------------------------------------------------

type Lang = "javascript" | "python" | "php" | "curl";

const LANG_LABELS: Record<Lang, string> = {
  javascript: "JavaScript",
  python: "Python",
  php: "PHP",
  curl: "cURL",
};

const sampleValueOf = (f: Field): string | number =>
  f.sample !== undefined ? f.sample : f.placeholder ?? "";

const buildSamples = (ep: EndpointDef): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  ep.fields.forEach((f) => {
    out[f.apiName ?? f.name] = sampleValueOf(f);
  });
  return out;
};

const buildQueryString = (params: Record<string, string | number>): string => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => usp.append(k, String(v)));
  return usp.toString() ? `?${usp.toString()}` : "";
};

const KEY_PLACEHOLDER = "mc_sandbox_XXXXXXXXXXXXXXXXXXXX";

function generateJS(ep: EndpointDef): string {
  const samples = buildSamples(ep);
  const fullPath =
    ep.paramsIn === "query" ? ep.path + buildQueryString(samples) : ep.path;
  const body = ep.paramsIn === "body"
    ? `,\n  body: JSON.stringify(${JSON.stringify(samples, null, 2).replace(/\n/g, "\n  ")})`
    : "";
  const contentType = ep.paramsIn === "body" ? "'Content-Type': 'application/json',\n    " : "";

  const post = ep.id === "create-payment"
    ? `\n\n// Rediriger le client vers la page MonCash pour qu'il paie\nwindow.location.href = data.payment_url;`
    : "";

  return `const API_URL = '${API_URL}';
const API_KEY = '${KEY_PLACEHOLDER}';

const res = await fetch(\`\${API_URL}${fullPath}\`, {
  method: '${ep.method}',
  headers: {
    ${contentType}'X-API-Key': API_KEY,
  }${body}
});

const data = await res.json();
console.log(data);${post}`;
}

function generatePython(ep: EndpointDef): string {
  const samples = buildSamples(ep);
  const fullPath =
    ep.paramsIn === "query" ? ep.path + buildQueryString(samples) : ep.path;

  const lines: string[] = [
    "import requests",
    "",
    `API_URL = '${API_URL}'`,
    `API_KEY = '${KEY_PLACEHOLDER}'`,
    "",
    `res = requests.${ep.method.toLowerCase()}(`,
    `    f'{API_URL}${fullPath}',`,
    `    headers={'X-API-Key': API_KEY},`,
  ];
  if (ep.paramsIn === "body") {
    const py = JSON.stringify(samples, null, 4).replace(/\n/g, "\n    ");
    lines.push(`    json=${py},`);
  }
  lines.push(")");
  lines.push("data = res.json()");
  lines.push("print(data)");
  if (ep.id === "create-payment") {
    lines.push("");
    lines.push("# Rediriger le client vers data['payment_url']");
  }
  return lines.join("\n");
}

function generatePHP(ep: EndpointDef): string {
  const samples = buildSamples(ep);
  const fullPath =
    ep.paramsIn === "query" ? ep.path + buildQueryString(samples) : ep.path;

  const phpBody = ep.paramsIn === "body"
    ? "json_encode(" +
      JSON.stringify(samples, null, 4)
        .replace(/"/g, "'")
        .replace(/'(\w+)':/g, "'$1' =>")
        .replace(/\n/g, "\n    ")
      + ")"
    : null;

  const headers: string[] = ["'X-API-Key: ' . $apiKey"];
  if (ep.paramsIn === "body") headers.unshift("'Content-Type: application/json'");

  const opts = [
    "CURLOPT_RETURNTRANSFER => true",
    ...(ep.method === "POST" ? ["CURLOPT_POST => true"] : []),
    `CURLOPT_HTTPHEADER => [\n        ${headers.join(",\n        ")}\n    ]`,
    ...(phpBody ? [`CURLOPT_POSTFIELDS => ${phpBody}`] : []),
  ];

  return `<?php
$apiUrl = '${API_URL}';
$apiKey = '${KEY_PLACEHOLDER}';

$ch = curl_init("$apiUrl${fullPath}");
curl_setopt_array($ch, [
    ${opts.join(",\n    ")}
]);
$data = json_decode(curl_exec($ch), true);
print_r($data);${
    ep.id === "create-payment"
      ? "\n\n// Rediriger le client : header('Location: ' . $data['payment_url']);"
      : ""
  }`;
}

function generateCurl(ep: EndpointDef): string {
  const samples = buildSamples(ep);
  const fullPath =
    ep.paramsIn === "query" ? ep.path + buildQueryString(samples) : ep.path;

  const parts: string[] = [
    `curl -X ${ep.method} ${API_URL}${fullPath} \\`,
    `  -H "X-API-Key: ${KEY_PLACEHOLDER}"`,
  ];
  if (ep.paramsIn === "body") {
    parts[parts.length - 1] += " \\";
    parts.push(`  -H "Content-Type: application/json" \\`);
    parts.push(`  -d '${JSON.stringify(samples)}'`);
  }
  return parts.join("\n");
}

const GENERATORS: Record<Lang, (ep: EndpointDef) => string> = {
  javascript: generateJS,
  python: generatePython,
  php: generatePHP,
  curl: generateCurl,
};

// -----------------------------------------------------------------------------
// Composant principal
// -----------------------------------------------------------------------------

type Props = {
  apiKeys: ApiKey[];
  onSuccess?: () => void;
};

type ExecState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: unknown; durationMs: number }
  | { status: "error"; message: string; httpStatus?: number };

const STORAGE_KEY = "moncash_tester_apikey";

const EndpointTester = ({ apiKeys, onSuccess }: Props) => {
  const [rawKey, setRawKey] = useState<string>(
    () => sessionStorage.getItem(STORAGE_KEY) ?? ""
  );
  const [selectedPrefix, setSelectedPrefix] = useState<string | undefined>(
    apiKeys[0]?.key_prefix
  );

  const handleKeyChange = (val: string) => {
    setRawKey(val);
    if (val) sessionStorage.setItem(STORAGE_KEY, val);
    else sessionStorage.removeItem(STORAGE_KEY);
  };

  const selectedKey = useMemo(
    () => apiKeys.find((k) => k.key_prefix === selectedPrefix),
    [apiKeys, selectedPrefix]
  );

  const matchesSelected =
    !selectedKey || rawKey.startsWith(selectedKey.key_prefix);

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="text-xl font-bold text-foreground mb-1">
        Tester les endpoints
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Postman intégré — exécutez vos appels et copiez le code prêt à intégrer.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="key-select">Clé à utiliser</Label>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">
              Créez d'abord une clé pour pouvoir tester.
            </p>
          ) : (
            <Select
              value={selectedPrefix}
              onValueChange={(v) => setSelectedPrefix(v)}
            >
              <SelectTrigger id="key-select">
                <SelectValue placeholder="Choisir une clé" />
              </SelectTrigger>
              <SelectContent>
                {apiKeys.map((k) => (
                  <SelectItem key={k.id} value={k.key_prefix}>
                    {k.name} — {k.key_prefix}… ({k.environment})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label htmlFor="raw-key">Clé en clair (pour l'onglet Tester)</Label>
          <Input
            id="raw-key"
            type="password"
            value={rawKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="Collez ici votre clé (mc_sandbox_… ou mc_live_…)"
          />
          {selectedKey && rawKey && !matchesSelected && (
            <p className="text-xs text-destructive mt-1">
              Cette clé ne correspond pas au préfixe {selectedKey.key_prefix}…
            </p>
          )}
        </div>
      </div>

      {apiKeys.length === 0 ? null : (
        <Accordion type="single" collapsible className="space-y-2">
          {ENDPOINTS.map((ep) => (
            <EndpointPanel
              key={ep.id}
              endpoint={ep}
              apiKey={rawKey}
              onSuccess={onSuccess}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Panneau d'un endpoint
// -----------------------------------------------------------------------------

const MethodBadge = ({ method }: { method: "GET" | "POST" }) => (
  <span
    className={`text-xs font-bold px-2 py-0.5 rounded ${
      method === "GET"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-blue-100 text-blue-700"
    }`}
  >
    {method}
  </span>
);

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copié.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Impossible de copier — sélectionnez manuellement.");
    }
  };
  return (
    <div className="relative">
      <pre className="code-block p-4 pr-12 rounded-lg overflow-x-auto text-xs">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        onClick={copy}
        className="absolute top-2 right-2 h-7 w-7 p-0 text-slate-300 hover:text-slate-100 hover:bg-slate-700/50"
        aria-label="Copier"
      >
        {copied ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

const EndpointPanel = ({
  endpoint,
  apiKey,
  onSuccess,
}: {
  endpoint: EndpointDef;
  apiKey: string;
  onSuccess?: () => void;
}) => {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(endpoint.fields.map((f) => [f.name, ""]))
  );
  const [state, setState] = useState<ExecState>({ status: "idle" });
  const [activeLang, setActiveLang] = useState<Lang>("javascript");

  const updateField = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const onRun = async () => {
    setState({ status: "loading" });
    const start = performance.now();
    try {
      const data = await endpoint.execute(apiKey, values);
      setState({
        status: "success",
        data,
        durationMs: Math.round(performance.now() - start),
      });
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : (err as Error).message;
      const httpStatus = err instanceof ApiError ? err.status : undefined;
      setState({ status: "error", message: msg, httpStatus });
      onSuccess?.();
    }
  };

  const disabled =
    !apiKey ||
    state.status === "loading" ||
    endpoint.fields.some((f) => !values[f.name]);

  const paymentUrl =
    state.status === "success" &&
    state.data &&
    typeof state.data === "object" &&
    "payment_url" in state.data &&
    typeof (state.data as { payment_url: unknown }).payment_url === "string"
      ? ((state.data as { payment_url: string }).payment_url as string)
      : null;

  return (
    <AccordionItem
      value={endpoint.id}
      className="border border-border rounded-lg px-4 bg-background/50"
    >
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 text-left flex-1">
          <MethodBadge method={endpoint.method} />
          <code className="text-xs text-muted-foreground hidden sm:inline">
            {endpoint.path}
          </code>
          <span className="font-medium text-foreground">{endpoint.label}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <p className="text-sm text-muted-foreground mb-4">
          {endpoint.description}
        </p>

        <Tabs defaultValue="test" className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="test">
              <Play className="mr-1 h-3.5 w-3.5" /> Tester
            </TabsTrigger>
            <TabsTrigger value="code">
              <Copy className="mr-1 h-3.5 w-3.5" /> Code
            </TabsTrigger>
          </TabsList>

          {/* === Tester === */}
          <TabsContent value="test" className="space-y-4">
            {!apiKey && (
              <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                Collez votre clé en clair dans la zone du haut pour activer le bouton d'exécution.
              </div>
            )}

            {endpoint.fields.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {endpoint.fields.map((f) => (
                  <div key={f.name}>
                    <Label htmlFor={`${endpoint.id}-${f.name}`}>{f.label}</Label>
                    <Input
                      id={`${endpoint.id}-${f.name}`}
                      type={f.type === "number" ? "number" : "text"}
                      value={values[f.name]}
                      onChange={(e) => updateField(f.name, e.target.value)}
                      placeholder={f.placeholder}
                      disabled={state.status === "loading"}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={onRun}
              disabled={disabled}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              {state.status === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exécution…
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Exécuter
                </>
              )}
            </Button>

            {state.status === "success" && (
              <div>
                <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Succès</span>
                  <span className="text-muted-foreground">
                    en {state.durationMs} ms
                  </span>
                </div>

                {paymentUrl && (
                  <div className="mb-3 rounded-lg border-2 border-primary/40 bg-primary/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">
                          Paiement créé avec succès
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Redirigez votre client vers cette page hébergée par
                          MonCash pour qu'il finalise le paiement.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            asChild
                            size="sm"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold"
                          >
                            <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-3.5 w-3.5" />
                              Ouvrir la page de paiement
                            </a>
                          </Button>
                          <code className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded break-all max-w-full">
                            {paymentUrl}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <CodeBlock code={JSON.stringify(state.data, null, 2)} />
              </div>
            )}

            {state.status === "error" && (
              <div>
                <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                  <ServerCrash className="h-4 w-4" />
                  <span className="font-medium">
                    Erreur{state.httpStatus ? ` (HTTP ${state.httpStatus})` : ""}
                  </span>
                </div>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {state.message}
                </div>
              </div>
            )}
          </TabsContent>

          {/* === Code === */}
          <TabsContent value="code" className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(LANG_LABELS) as Lang[]).map((lang) => (
                <Button
                  key={lang}
                  variant={activeLang === lang ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLang(lang)}
                  className={
                    activeLang === lang
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : ""
                  }
                >
                  {LANG_LABELS[lang]}
                </Button>
              ))}
            </div>

            <CodeBlock code={GENERATORS[activeLang](endpoint)} />

            <p className="text-xs text-muted-foreground">
              Remplacez{" "}
              <code className="bg-secondary px-1 py-0.5 rounded">
                {KEY_PLACEHOLDER}
              </code>{" "}
              par votre vraie clé API. Elle se transmet via l'en-tête{" "}
              <code className="bg-secondary px-1 py-0.5 rounded">X-API-Key</code>.
            </p>
          </TabsContent>
        </Tabs>
      </AccordionContent>
    </AccordionItem>
  );
};

export default EndpointTester;
