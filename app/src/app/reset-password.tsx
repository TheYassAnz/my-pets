import { router, useLocalSearchParams } from 'expo-router';
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
      <View className="flex-1 justify-center bg-white dark:bg-black px-8 gap-4">
        <Text className="text-2xl font-bold text-black dark:text-white text-center mb-2">
          Mot de passe mis à jour
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-6">
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe
        </Text>
        <Pressable
          className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80"
          onPress={() => router.replace('/sign-in')}>
          <Text className="text-white font-semibold text-base">Se connecter</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-white dark:bg-black px-8 gap-4">
      <Text className="text-3xl font-bold text-black dark:text-white text-center mb-2">
        Nouveau mot de passe
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-6">
        Entrez le code reçu par email et votre nouveau mot de passe
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
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Code à 6 chiffres"
        placeholderTextColor="#9ca3af"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Nouveau mot de passe"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        autoComplete="password-new"
        value={newPassword}
        onChangeText={setNewPassword}
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
          <Text className="text-white font-semibold text-base">Réinitialiser</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}
