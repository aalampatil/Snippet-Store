import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../../config/axiosApi";
import { getErrorMessage } from "@/utils/errors";

type AuthUser = {
  id: number;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AUTH_TOKEN_KEY = "auth_token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!active) return;
        setToken(stored);
        if (stored) {
          const me = await api.get<{ data: AuthUser }>("/api/auth/me", {
            headers: { Authorization: `Bearer ${stored}` },
          });
          if (!active) return;
          setUser(me.data.data);
        }
      } catch {
        // token is invalid/expired or request failed; treat as logged out
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        if (!active) return;
        setToken(null);
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.post<{ data: { token: string; user: AuthUser } }>("/api/auth/login", { email, password });
      const nextToken = res.data.data.token;
      const nextUser = res.data.data.user;
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.post<{ data: { token: string; user: AuthUser } }>("/api/auth/register", { email, password });
      const nextToken = res.data.data.token;
      const nextUser = res.data.data.user;
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.replace("/login" as any);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      register,
      logout,
      clearError: () => setError(null),
    }),
    [user, token, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
