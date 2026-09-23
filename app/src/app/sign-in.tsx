import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, FormField, Icon } from '@/components/ui';
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-surface-sunken">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 }}>
          <View>
            {/* Bouton Retour Circulaire */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => router.back()}
              className="w-[34px] h-[34px] rounded-full items-center justify-center bg-surface border border-border">
              <Icon name="chevron-left" size={16} color="rgb(var(--color-text))" />
            </Pressable>

            <Text className="text-[27px] font-medium tracking-tight text-text mt-4 mb-6">
              Content de vous revoir
            </Text>

            <View className="gap-4">
              <FormField
                control={control}
                name="email"
                label="E-mail"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
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

              <View className="flex-row items-center justify-between mt-1">
                <Link href="/forgot-password" asChild>
                  <Text className="text-[13px] text-primary">Mot de passe oublié</Text>
                </Link>

                <View className="flex-row items-center gap-1.5 opacity-70">
                  <Icon name="lock" size={15} color="rgb(var(--color-primary))" />
                  <Text className="text-[13px] text-text-secondary">Face ID</Text>
                </View>
              </View>

              {error ? <Text className="text-body text-danger">{error}</Text> : null}

              <Button
                label="Se connecter"
                variant="primary"
                className="mt-3"
                loading={formState.isSubmitting}
                onPress={onSubmit}
              />
            </View>
          </View>

          <View className="flex-row justify-center gap-1 my-6">
            <Text className="text-text-secondary">Pas encore de compte ?</Text>
            <Link href="/sign-up" asChild>
              <Text className="text-primary font-semibold">Créer un compte</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
