import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';

export default function ResetPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || code.length !== 6 || !newPassword) {
      setError('Email, code à 6 chiffres et nouveau mot de passe requis');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.resetPassword(email.trim().toLowerCase(), code, newPassword);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Réinitialisation impossible');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 justify-center bg-surface px-8 gap-4">
        <Text className="text-title font-bold text-text text-center mb-2">
          Mot de passe mis à jour
        </Text>
        <Text className="text-body text-text-secondary text-center mb-6">
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe
        </Text>
        <Button label="Se connecter" onPress={() => router.replace('/sign-in')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-surface px-8 gap-4">
      <Text className="text-display font-bold text-text text-center mb-2">
        Nouveau mot de passe
      </Text>
      <Text className="text-body text-text-secondary text-center mb-6">
        Entrez le code reçu par email et votre nouveau mot de passe
      </Text>

      <Input
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Input
        label="Code à 6 chiffres"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <Input
        label="Nouveau mot de passe"
        secureTextEntry
        autoComplete="password-new"
        value={newPassword}
        onChangeText={setNewPassword}
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-callout text-danger">{error}</Text>}

      <Button label="Réinitialiser" loading={submitting} onPress={onSubmit} />
    </KeyboardAvoidingView>
  );
}
