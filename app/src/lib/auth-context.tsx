import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';

import { api, clearTokens, storeTokens, type User } from './api';
import { ACCESS_TOKEN_KEY, getToken } from './token-storage';

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

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restauration de session au démarrage : token présent → /auth/me
  // (le client API tente un refresh automatique si l'access token a expiré)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await getToken(ACCESS_TOKEN_KEY);
        if (token) {
          const me = await api.me();
          if (!cancelled) setUser(me);
        }
      } catch {
        await clearTokens();
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
    await storeTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const signUp = async (email: string, password: string) => {
    const res = await api.register(email, password);
    await storeTokens(res.accessToken, res.refreshToken);
    setUser(res.user);
  };

  const signOut = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
