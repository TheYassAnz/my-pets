import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email) {
      setError('Email requis');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await api.forgotPassword(normalizedEmail);
      router.push({
        pathname: '/reset-password',
        params: { email: normalizedEmail },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-surface px-8 gap-4">
      <Text className="text-display font-bold text-text text-center mb-2">
        Mot de passe oublié
      </Text>
      <Text className="text-body text-text-secondary text-center mb-6">
        Recevez un code par email pour réinitialiser votre mot de passe
      </Text>

      <Input
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-body text-danger">{error}</Text>}

      <Button label="Envoyer le code" loading={submitting} onPress={onSubmit} />

      <View className="flex-row justify-center items-center gap-1 mt-4">
        <Text className="text-text-secondary">Vous vous souvenez ?</Text>
        <Button variant="ghost" label="Se connecter" onPress={() => router.back()} />
      </View>
    </KeyboardAvoidingView>
  );
}
