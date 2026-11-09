import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, refreshSession, setAccessToken, type User } from './api';
import { unregisterPushNotifications } from './notifications';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
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

  // Restauration de session au démarrage : le cookie refresh donne un access
  // token, puis /auth/me
  useEffect(() => {
    let cancelled = false;

    clearLegacyTokens();
    (async () => {
      try {
        if (await refreshSession()) {
          const me = await api.me();
          if (!cancelled) setUser(me);
        }
      } catch {
        setAccessToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
    await unregisterPushNotifications();
    await api.logout();
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
