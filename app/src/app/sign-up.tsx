import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button, FormField } from '@/components/ui';
import { useSession } from '@/lib/auth-context';
import { signUpSchema, type SignUpValues } from '@/lib/forms/schemas';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await signUp(values.email.trim().toLowerCase(), values.password);
      // Pas de navigation manuelle : Stack.Protected bascule vers (app)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible');
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-center bg-surface px-8 gap-4">
      <Text className="text-display font-bold text-text text-center mb-2">my-pets 🐾</Text>
      <Text className="text-body text-text-secondary text-center mb-6">Créez votre compte</Text>

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
        placeholder="8 caractères min."
        inputRef={passwordRef}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <FormField
        control={control}
        name="confirm"
        label="Confirmer le mot de passe"
        inputRef={confirmRef}
        secureTextEntry
        autoComplete="new-password"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-callout text-danger">{error}</Text>}

      <Button label="Créer mon compte" loading={formState.isSubmitting} onPress={onSubmit} />

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
