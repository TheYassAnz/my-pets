import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { Icon } from './icon';

const DISMISS_AFTER_MS = 3000;

type ToastType = 'success' | 'error';
type ToastState = { message: string; type: ToastType } | null;

type ToastApi = { show: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    // Mécanisme d'annonce unique, valable iOS ET Android. On n'utilise PAS
    // `accessibilityLiveRegion` en plus : il est annoté `@platform android`, donc
    // il ne couvrirait pas iOS, et cumulé à cet appel il ferait annoncer le
    // message deux fois par TalkBack.
    AccessibilityInfo.announceForAccessibility(message);
    timer.current = setTimeout(() => setToast(null), DISMISS_AFTER_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <View
          accessibilityRole="alert"
          // Rien à l'intérieur n'est interactif (l'annonce lecteur d'écran est
          // déjà gérée par announceForAccessibility) : sans ça, ce bandeau plein
          // écran intercepterait les taps pendant les 3 s où il est affiché.
          pointerEvents="none"
          className="absolute bottom-24 left-4 right-4 flex-row items-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-3">
          <Icon
            name={toast.type === 'success' ? 'check' : 'alert'}
            size={20}
            decorative
            color={colors.textSecondary}
          />
          <Text className="flex-1 text-callout text-text">{toast.message}</Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}
