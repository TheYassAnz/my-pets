import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';

import { registerDialogHost, type DialogRequest } from '@/lib/dialog';

import { Button } from './button';
import { Text } from './text';

export function DialogHost() {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  useEffect(() => registerDialogHost(setDialog), []);

  const close = (ok: boolean) => {
    dialog?.resolve(ok);
    setDialog(null);
  };

  return (
    <Modal transparent visible={!!dialog} animationType="fade" onRequestClose={() => close(false)}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View accessibilityViewIsModal className="w-full max-w-[420px] gap-4 rounded-lg bg-surface-elevated p-5">
          {dialog?.title ? <Text className="text-title font-bold text-text">{dialog.title}</Text> : null}
          <Text className="text-body text-text">{dialog?.message}</Text>
          <View className="flex-row justify-end gap-2">
            {dialog?.cancellable ? (
              <Button label="Annuler" variant="ghost" onPress={() => close(false)} />
            ) : null}
            <Button
              label={dialog?.confirmLabel ?? ''}
              variant={dialog?.destructive ? 'destructive' : 'primary'}
              onPress={() => close(true)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
