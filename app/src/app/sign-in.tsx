import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button, FormField } from '@/components/ui';
import { useSession } from '@/lib/auth-context';
import { signInSchema, type SignInValues } from '@/lib/forms/schemas';

export default function SignInScreen() {
  const { signIn } = useSession();
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await signIn(values.email.trim().toLowerCase(), values.password);
      // Pas de navigation manuelle : Stack.Protected bascule vers (app)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-surface px-8 gap-4">
      <Text className="text-display font-bold text-text text-center mb-2">my-pets 🐾</Text>
      <Text className="text-body text-text-secondary text-center mb-6">
        Connexion à votre carnet de santé
      </Text>

      <FormField
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="next"
        // Garde le clavier ouvert et donne le focus au champ suivant (PET-7).
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormField
        control={control}
        name="password"
        label="Mot de passe"
        inputRef={passwordRef}
        secureTextEntry
        autoComplete="password"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-body text-danger">{error}</Text>}

      <Button
        variant="ghost"
        label="Mot de passe oublié ?"
        className="self-end"
        onPress={() => router.push('/forgot-password')}
      />

      <Button label="Se connecter" loading={formState.isSubmitting} onPress={onSubmit} />

      <View className="flex-row justify-center gap-1 mt-4">
        <Text className="text-text-secondary">Pas encore de compte ?</Text>
        {/* `asChild` est nécessaire : un `className` posé directement sur `Link`
            n'atteint pas le texte rendu (il restait noir, illisible en thème sombre). */}
        <Link href="/sign-up" asChild>
          <Text className="text-primary font-semibold">Créer un compte</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
