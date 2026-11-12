import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { isAxiosError } from "axios";
import { api, setUnauthorizedHandler } from "../../config/axiosApi";
import { readSession, writeSession } from "@/services/authStorage";
import { getErrorMessage } from "@/utils/errors";

type AuthUser = { id: number; email: string };
type AuthResult = { token?: string; user: AuthUser } | { requiresVerification: true; message: string };
type AuthContextValue = {
  user: AuthUser | null; loading: boolean; submitting: boolean; error: string | null; message: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requestEmail: (email: string, purpose: "reset" | "verify") => Promise<void>;
  deleteAccount: (password: string) => Promise<boolean>;
  clearError: () => void;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const clearError = useCallback(() => { setError(null); setMessage(null); }, []);

  useEffect(() => {
    let active = true;
    let restoring = true;
    let hadSavedSession = false;
    setUnauthorizedHandler(() => {
      generation.current++;
      setUser(null);
      setError(!restoring || hadSavedSession ? "Your session has expired. Please sign in again." : null);
      void writeSession(null).catch(() => setError("Could not clear saved credentials. Please restart the app."));
    });
    void (async () => {
      try {
        const token = await readSession();
        hadSavedSession = !!token;
        if (!active || (Platform.OS !== "web" && !token)) return;
        const version = generation.current;
        const response = await api.get<{ data: AuthUser }>("/api/auth/me");
        if (active && generation.current === version) setUser(response.data.data);
      } catch (err) {
        // A network outage must not destroy a valid saved session.
        if (active && !(isAxiosError(err) && err.response?.status === 401)) setError(getErrorMessage(err));
      } finally { restoring = false; if (active) setLoading(false); }
    })();
    return () => { active = false; setUnauthorizedHandler(); };
  }, []);

  const authenticate = useCallback(async (path: "login" | "register", email: string, password: string) => {
    if (busy.current) return;
    busy.current = true;
    setSubmitting(true); setError(null); setMessage(null);
    try {
      const response = await api.post<{ data: AuthResult }>(`/api/auth/${path}`, { email: email.trim(), password });
      const result = response.data.data;
      if ("requiresVerification" in result) { setMessage(result.message); return; }
      try { await writeSession(result.token ?? null); }
      catch (storageError) {
        // A session that cannot be saved must be revoked rather than left active.
        await api.post("/api/auth/logout", {}, { headers: result.token ? { Authorization: `Bearer ${result.token}` } : {} }).catch(() => {});
        throw storageError;
      }
      generation.current++;
      setError(null);
      setUser(result.user);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { busy.current = false; setSubmitting(false); }
  }, []);

  const requestEmail = useCallback(async (email: string, purpose: "reset" | "verify") => {
    if (busy.current) return;
    busy.current = true; setSubmitting(true); setError(null); setMessage(null);
    try {
      const response = await api.post<{ data: { message: string } }>(
        purpose === "reset" ? "/api/auth/forgot-password" : "/api/auth/resend-verification", { email: email.trim() });
      setMessage(response.data.data.message);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { busy.current = false; setSubmitting(false); }
  }, []);

  const logout = useCallback(async () => {
    if (busy.current) return;
    busy.current = true; setSubmitting(true);
    try {
      await api.post("/api/auth/logout");
      await writeSession(null);
      generation.current++;
      setUser(null); setError(null); setMessage(null);
    } catch (err) { Alert.alert("Could not sign out", getErrorMessage(err)); }
    finally { busy.current = false; setSubmitting(false); }
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    if (busy.current) return false;
    busy.current = true; setSubmitting(true); setError(null);
    try {
      await api.delete("/api/auth/account", { data: { password } });
      generation.current++;
      setUser(null);
      await writeSession(null);
      return true;
    } catch (err) { setError(getErrorMessage(err)); return false; }
    finally { busy.current = false; setSubmitting(false); }
  }, []);

  return <AuthContext.Provider value={{
    user, loading, submitting, error, message,
    login: (email, password) => authenticate("login", email, password),
    register: (email, password) => authenticate("register", email, password),
    requestEmail, logout, deleteAccount, clearError,
  }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
