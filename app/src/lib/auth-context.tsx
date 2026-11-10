import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, ApiError, refreshOutcome, setAccessToken, type User } from './api';
import { detachPushSubscription } from './notifications';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  // Restauration impossible (réseau, serveur) : distinct d'une session refusée
  restoreFailed: boolean;
  retryRestore: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useSession(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useSession doit être utilisé sous <SessionProvider>');
  }
  return value;
}

// Tokens de l'ancienne version (localStorage) : à purger, jamais bloquant
export function clearLegacyTokens(): void {
  try {
    localStorage.removeItem('mypets.accessToken');
    localStorage.removeItem('mypets.refreshToken');
  } catch {
    // localStorage absent ou inaccessible
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Restauration de session au démarrage : le cookie refresh donne un access
  // token, puis /auth/me. Un refus (cookie invalide, 401) = anonyme ; tout
  // autre échec = restoreFailed, pour ne pas déconnecter à tort.
  useEffect(() => {
    let cancelled = false;

    clearLegacyTokens();
    (async () => {
      try {
        const outcome = await refreshOutcome();
        if (outcome === 'unreachable') {
          if (!cancelled) setRestoreFailed(true);
        } else if (outcome === 'ok') {
          const me = await api.me();
          if (!cancelled) setUser(me);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setAccessToken(null);
        else if (!cancelled) setRestoreFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retryRestore = () => {
    setRestoreFailed(false);
    setIsLoading(true);
    setAttempt((n) => n + 1);
  };

  const signIn = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const signUp = async (email: string, password: string) => {
    const res = await api.register(email, password);
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const signOut = async () => {
    // Suppression serveur avant le logout (session requise) ; désabonnement local après succès
    const sub = await detachPushSubscription();
    try {
      await api.logout();
    } catch (e) {
      // Session conservée : on remet l'abonnement côté serveur pour ne pas perdre les rappels
      if (sub) await api.savePushSubscription(sub.toJSON() as PushSubscriptionJSON).catch(() => {});
      throw e;
    }
    await sub?.unsubscribe().catch(() => {});
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, restoreFailed, retryRestore, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
