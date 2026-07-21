import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Input } from '@/components/ui';
import { useSession } from '@/lib/auth-context';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      setError('Email et mot de passe requis');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim().toLowerCase(), password);
      // Pas de navigation manuelle : Stack.Protected bascule vers (app)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-surface px-8 gap-4">
      <Text className="text-display font-bold text-text text-center mb-2">my-pets 🐾</Text>
      <Text className="text-body text-text-secondary text-center mb-6">Créez votre compte</Text>

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
        placeholder="8 caractères min."
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />
      <Input
        label="Confirmer le mot de passe"
        secureTextEntry
        autoComplete="new-password"
        value={confirm}
        onChangeText={setConfirm}
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-callout text-danger">{error}</Text>}

      <Button label="Créer mon compte" loading={submitting} onPress={onSubmit} />

      <View className="flex-row justify-center gap-1 mt-4">
        <Text className="text-text-secondary">Déjà un compte ?</Text>
        {/* `asChild` est nécessaire : un `className` posé directement sur `Link`
            n'atteint pas le texte rendu (il restait noir, illisible en thème sombre). */}
        <Link href="/sign-in" asChild>
          <Text className="text-primary font-semibold">Se connecter</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
