import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  tokenStore,
  usersApi,
  type SignupPayload,
  type UserProfile,
} from "@/lib/api";

type AuthContextValue = {
  token: string | null;
  username: string | null;
  user: UserProfile | null;
  /** True si user.role === "super_admin" */
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  logout: () => void;
  /** Recharge le profil depuis le backend (ex: après changement de commission) */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Décode le `sub` du JWT pour avoir un username avant le fetch de /users/me
function decodeJwtSub(jwt: string): string | null {
  try {
    const [, payload] = jwt.split(".");
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof json?.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState<string | null>(() => {
    const t = tokenStore.get();
    return t ? decodeJwtSub(t) : null;
  });

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await usersApi.me();
      setUser(profile);
      setUsername(profile.username);
    } catch {
      // Token probablement invalide / expiré → on déconnecte
      tokenStore.clear();
      setToken(null);
      setUser(null);
      setUsername(null);
    }
  }, []);

  // Au chargement initial : si un token est présent, charge le profil
  useEffect(() => {
    if (token) {
      void fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync entre onglets
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "moncash_access_token") {
        const t = e.newValue;
        setToken(t);
        if (t) {
          setUsername(decodeJwtSub(t));
          void fetchProfile();
        } else {
          setUsername(null);
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchProfile]);

  const login = async (u: string, p: string) => {
    const res = await authApi.login(u, p);
    tokenStore.set(res.access_token);
    setToken(res.access_token);
    setUsername(decodeJwtSub(res.access_token));
    await fetchProfile();
  };

  const signup = async (data: SignupPayload) => {
    await authApi.signup(data);
    await login(data.username, data.password);
  };

  const logout = () => {
    tokenStore.clear();
    setToken(null);
    setUsername(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      username,
      user,
      isAuthenticated: !!token,
      isSuperAdmin: user?.role === "super_admin",
      login,
      signup,
      logout,
      refreshProfile: fetchProfile,
    }),
    [token, username, user, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
