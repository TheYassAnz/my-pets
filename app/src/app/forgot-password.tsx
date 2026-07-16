import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

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
      className="flex-1 justify-center bg-white dark:bg-black px-8 gap-4">
      <Text className="text-3xl font-bold text-black dark:text-white text-center mb-2">
        Mot de passe oublié
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-6">
        Recevez un code par email pour réinitialiser votre mot de passe
      </Text>

      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>}

      <Pressable
        className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80 disabled:opacity-50"
        disabled={submitting}
        onPress={onSubmit}>
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Envoyer le code</Text>
        )}
      </Pressable>

      <View className="flex-row justify-center gap-1 mt-4">
        <Text className="text-gray-500 dark:text-gray-400">Vous vous souvenez ?</Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-blue-600 font-semibold">Se connecter</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
