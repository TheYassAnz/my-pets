// L'API Alert de React Native est un no-op sur react-native-web, et window.confirm/alert
// n'affichent rien dans la PWA installée sur mobile : un <DialogHost /> monté à la racine
// affiche la modale. Sans hôte (tests isolés), on retombe sur les dialogues du navigateur.

export type DialogRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  cancellable: boolean;
  resolve: (ok: boolean) => void;
};

let host: ((d: DialogRequest) => void) | null = null;

export function registerDialogHost(show: (d: DialogRequest) => void): () => void {
  host = show;
  return () => {
    if (host === show) host = null;
  };
}

export function confirmAction(
  title: string,
  message: string,
  opts: { confirmLabel?: string; destructive?: boolean } = {},
): Promise<boolean> {
  if (!host) return Promise.resolve(window.confirm(`${title}\n${message}`));
  const show = host;
  return new Promise((resolve) =>
    show({
      title,
      message,
      confirmLabel: opts.confirmLabel ?? 'Confirmer',
      destructive: opts.destructive ?? false,
      cancellable: true,
      resolve,
    }),
  );
}

export function notifyError(message: string): void {
  if (!host) return window.alert(message);
  host({ title: '', message, confirmLabel: 'OK', destructive: false, cancellable: false, resolve: () => {} });
}
