import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View, type TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPortraits } from '@/components/auth-portraits';
import { Button, FormField } from '@/components/ui';
import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/auth-context';
import { signInSchema, type SignInValues } from '@/lib/forms/schemas';

export default function SignInScreen() {
  const { signIn } = useSession();
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<RNTextInput>(null);

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
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
          <View>
            <AuthPortraits />
            <Text accessibilityRole="header" className="text-[32px] font-bold text-text">
              Connexion
            </Text>
            <Text className="mt-2.5 mb-8 text-[17px] font-semibold text-text-secondary">
              Retrouvez le carnet de vos animaux.
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
              <Link href="/forgot-password" asChild>
                <Text accessibilityRole="link" className="min-h-[44px] py-3 text-[14px] text-text-secondary">
                  Mot de passe oublié ?
                </Text>
              </Link>
              {error ? <Text className="text-body text-danger">{error}</Text> : null}
            </View>
          </View>

          <View>
            <Button label="Continuer" variant="primary" loading={formState.isSubmitting} onPress={onSubmit} />
            <View className="mt-4 flex-row items-center justify-center gap-1">
              <Text className="text-[15px] text-text-secondary">Pas encore de compte ?</Text>
              <Text
                accessibilityRole="link"
                onPress={() => router.replace('/sign-up')}
                className="min-h-[44px] py-3 text-[15px] font-bold text-text">
                Créer un compte
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
