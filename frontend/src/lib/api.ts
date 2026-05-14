// Client HTTP minimal pour parler au backend FastAPI.
// Le token JWT est stocké dans localStorage et injecté dans Authorization.

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

const TOKEN_KEY = "moncash_access_token";

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type Body = Record<string, unknown> | FormData | undefined;

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: Body;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
    // ne pas fixer Content-Type, le navigateur ajoute la boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: payload,
  });

  // 204 / vide
  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const detail =
      (data &&
        typeof data === "object" &&
        "detail" in data &&
        typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : null) || res.statusText || `HTTP ${res.status}`;
    throw new ApiError(detail, res.status, data);
  }

  return data as T;
}

// ---- Endpoints ----

export type Token = { access_token: string; token_type: string };

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  commission_rate: number;
};

export type SignupPayload = {
  username: string;
  email: string;
  password: string;
  phone: string;
};

export const authApi = {
  // POST /token — OAuth2PasswordRequestForm => form-urlencoded
  login: async (username: string, password: string): Promise<Token> => {
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);
    return request<Token>("/token", { method: "POST", body: form, auth: false });
  },

  // POST /users/ — JSON
  signup: async (data: SignupPayload): Promise<UserResponse> => {
    return request<UserResponse>("/users/", {
      method: "POST",
      body: { ...data },
      auth: false,
    });
  },
};

// ---- Self-service utilisateur ----

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: "user" | "super_admin" | string;
  commission_rate: number;
};

export type CommissionSummary = {
  commission_rate: number;
  total_commission_owed: number;
  successful_transactions_count: number;
  total_volume: number;
};

export const usersApi = {
  me: () => request<UserProfile>("/users/me", { method: "GET" }),
  commissionSummary: () =>
    request<CommissionSummary>("/users/me/commission-summary", { method: "GET" }),
};

// ---- Admin (super_admin uniquement) ----

export type ApiKeySummaryAdmin = {
  id: number;
  name: string;
  key_prefix: string;
  environment: string;
  redirect_url: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type UserListAdminItem = UserProfile & {
  total_commission_owed: number;
  total_volume_successful: number;
  successful_transactions_count: number;
  failed_transactions_count: number;
  pending_transactions_count: number;
  api_keys_count: number;
  active_api_keys_count: number;
};

export type UserDetailAdmin = UserListAdminItem & {
  api_keys: ApiKeySummaryAdmin[];
};

export const adminApi = {
  listUsers: () => request<UserListAdminItem[]>("/admin/users", { method: "GET" }),
  getUser: (userId: number) =>
    request<UserDetailAdmin>(`/admin/users/${userId}`, { method: "GET" }),
  userTransactions: (userId: number, opts: { skip?: number; limit?: number } = {}) => {
    const { skip = 0, limit = 100 } = opts;
    const qs = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    return request<Transaction[]>(
      `/admin/users/${userId}/transactions?${qs.toString()}`,
      { method: "GET" }
    );
  },
  setCommission: (userId: number, rate: number) =>
    request<UserProfile>(`/admin/users/${userId}/commission`, {
      method: "PATCH",
      body: { commission_rate: rate },
    }),
};

// ---- API Keys (JWT requis) ----

export type Environment = "sandbox" | "live";

export type ApiKey = {
  id: number;
  name: string;
  key_prefix: string;
  environment: Environment;
  redirect_url: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  is_active: boolean;
};

export type ApiKeyCreated = ApiKey & { key: string };

export type ApiKeyCreatePayload = {
  name: string;
  environment: Environment;
  client_id: string;
  client_secret: string;
  /** URL où renvoyer le client après un paiement réussi (optionnelle). */
  redirect_url?: string;
};

export const apiKeyApi = {
  list: () => request<ApiKey[]>("/api-keys/", { method: "GET" }),
  create: (payload: ApiKeyCreatePayload) =>
    request<ApiKeyCreated>("/api-keys/", { method: "POST", body: payload }),
  revoke: (id: number) =>
    request<ApiKey>(`/api-keys/${id}`, { method: "DELETE" }),
};

// ---- Transactions (JWT requis) ----

export type TransactionStatus =
  | "created"
  | "successful"
  | "failed"
  | "expired"
  | string;

export type TransactionType = "payment" | "payout" | string;

export type Transaction = {
  id: number;
  order_id: string | null;
  transaction_id: string | null;
  payment_token: string | null;
  amount: number;
  currency: string;
  status: TransactionStatus;
  payer_phone: string | null;
  description: string | null;
  transaction_type: TransactionType;
  environment: string | null;
  payment_url: string | null;
  created_at: string;
  updated_at: string;
};

export const transactionsApi = {
  list: (opts: { skip?: number; limit?: number } = {}) => {
    const { skip = 0, limit = 100 } = opts;
    const qs = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    return request<Transaction[]>(`/transactions/?${qs.toString()}`, {
      method: "GET",
    });
  },
  /**
   * Interroge MonCash sur l'état réel du paiement et met à jour la transaction.
   * Renvoie la transaction mise à jour.
   */
  refreshStatus: (id: number) =>
    request<Transaction>(`/transactions/${id}/refresh-status`, {
      method: "POST",
    }),
};

// Type pour le payload de réponse de create-payment (incluant payment_url)
export type CreatePaymentResponse = {
  path: string;
  payment_token: { token: string; created: string; expired: string };
  timestamp: number;
  status: number;
  mode: string;
  payment_url: string | null;
};

// MonCash — authentifié par X-API-Key (clé de l'utilisateur, pas le JWT)
async function moncashRequest<T>(
  apiKey: string,
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: Record<string, unknown>;
  } = {}
): Promise<T> {
  const { method = "POST", body } = options;
  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);
  if (!res.ok) {
    const detail =
      (data && typeof data === "object" && "detail" in data
        ? (data as { detail: string }).detail
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(detail, res.status, data);
  }
  return data as T;
}

const q = (params: Record<string, string>) => {
  const usp = new URLSearchParams(params);
  return usp.toString() ? `?${usp.toString()}` : "";
};

export const moncashApi = {
  getToken: (apiKey: string) =>
    moncashRequest(apiKey, "/moncash/token"),

  createPayment: (apiKey: string, amount: number, orderId: string) =>
    moncashRequest(apiKey, "/moncash/create-payment", {
      body: { amount, orderId },
    }),

  retrieveTransaction: (apiKey: string, transactionId: string) =>
    moncashRequest(
      apiKey,
      `/moncash/retrieve-transaction-payment${q({ transaction_id: transactionId })}`
    ),

  retrieveOrder: (apiKey: string, orderId: string) =>
    moncashRequest(
      apiKey,
      `/moncash/retrieve-order-payment${q({ order_id: orderId })}`
    ),

  customerStatus: (apiKey: string, account: string) =>
    moncashRequest(apiKey, "/moncash/customer-status", {
      body: { account },
    }),

  transfer: (
    apiKey: string,
    payload: { amount: number; receiver: string; desc: string; reference: string }
  ) => moncashRequest(apiKey, "/moncash/transfert", { body: payload }),

  prefundedStatus: (apiKey: string, reference: string) =>
    moncashRequest(apiKey, "/moncash/prefunded-transaction-status", {
      body: { reference },
    }),

  prefundedBalance: (apiKey: string) =>
    moncashRequest(apiKey, "/moncash/prefunded-balance", { method: "GET" }),
};
