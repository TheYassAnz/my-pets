import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
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
      className="flex-1 justify-center bg-surface px-8 gap-4">
      <Text className="text-display font-bold text-text text-center mb-2">my-pets 🐾</Text>
      <Text className="text-body text-text-secondary text-center mb-6">
        Connexion à votre carnet de santé
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
        label="Mot de passe"
        secureTextEntry
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-callout text-danger">{error}</Text>}

      <Button
        variant="ghost"
        label="Mot de passe oublié ?"
        className="self-end"
        onPress={() => router.push('/forgot-password')}
      />

      <Button label="Se connecter" loading={submitting} onPress={onSubmit} />

      <View className="flex-row justify-center gap-1 mt-4">
        <Text className="text-text-secondary">Pas encore de compte ?</Text>
        <Link href="/sign-up" className="text-primary font-semibold">
          Créer un compte
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
