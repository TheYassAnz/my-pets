import { Link } from 'expo-router';
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

import { useSession } from '@/lib/auth-context';

export default function SignInScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Pas de navigation manuelle : Stack.Protected bascule vers (app)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-white dark:bg-black px-8 gap-4">
      <Text className="text-3xl font-bold text-black dark:text-white text-center mb-2">
        my-pets 🐾
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-6">
        Connexion à votre carnet de santé
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
        placeholder="Mot de passe"
        placeholderTextColor="#9ca3af"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
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
          <Text className="text-white font-semibold text-base">Se connecter</Text>
        )}
      </Pressable>

      <View className="flex-row justify-center gap-1 mt-4">
        <Text className="text-gray-500 dark:text-gray-400">Pas encore de compte ?</Text>
        <Link href="/sign-up" className="text-blue-600 font-semibold">
          Créer un compte
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
