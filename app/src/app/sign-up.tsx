import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Checkbox, FormField, Icon } from '@/components/ui';
import { useSession } from '@/lib/auth-context';
import { signUpSchema, type SignUpValues } from '@/lib/forms/schemas';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const { control, handleSubmit, watch, formState } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirm: '' },
  });

  const passwordValue = watch('password') || '';

  // Indicateur de force de mot de passe (Nocturne 12)
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (passwordValue.length >= 8) score++;
    if (passwordValue.length >= 12) score++;
    if (/[0-9]/.test(passwordValue) && /[^A-Za-z0-9]/.test(passwordValue)) score++;
    if (/[A-Z]/.test(passwordValue) && /[a-z]/.test(passwordValue)) score++;
    return Math.min(score, 4);
  }, [passwordValue]);

  const onSubmit = handleSubmit(async (values) => {
    if (!acceptedTerms) {
      setError('Veuillez accepter les conditions d’utilisation');
      return;
    }
    setError(null);
    try {
      await signUp(values.email.trim().toLowerCase(), values.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inscription impossible');
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-surface-sunken">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Bouton Retour Circulaire */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            className="w-[34px] h-[34px] rounded-full items-center justify-center bg-surface border border-border">
            <Icon name="chevron-left" size={16} color="rgb(var(--color-text))" />
          </Pressable>

          <Text className="text-[27px] font-medium tracking-tight text-text mt-4 mb-5">
            Créer un compte
          </Text>

          <View className="gap-3.5">
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

            <View className="gap-1.5">
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

              {/* Jauge de solidité du mot de passe */}
              {passwordValue.length > 0 ? (
                <View className="mt-1">
                  <View className="flex-row gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <View
                        key={step}
                        className={`flex-1 h-[3px] rounded-full ${
                          step <= passwordStrength ? 'bg-primary' : 'bg-surface'
                        }`}
                      />
                    ))}
                  </View>
                  <Text className="text-[11px] text-text-tertiary mt-1.5">
                    {passwordStrength >= 3
                      ? 'Solide · 12 caractères minimum recommandés'
                      : 'Moyen · Ajoutez des chiffres ou symboles'}
                  </Text>
                </View>
              ) : null}
            </View>

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

            {/* Conditions d'utilisation */}
            <Pressable
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              className="flex-row items-start gap-2.5 mt-1">
              <Checkbox checked={acceptedTerms} onToggle={setAcceptedTerms} />
              <Text className="flex-1 text-[12px] leading-relaxed text-text-secondary">
                J'accepte les conditions d'utilisation et la politique de confidentialité.
              </Text>
            </Pressable>

            {error ? <Text className="text-body text-danger">{error}</Text> : null}

            <Button
              label="Continuer"
              variant="primary"
              className="mt-2"
              loading={formState.isSubmitting}
              onPress={onSubmit}
            />

            <View className="flex-row items-center gap-3 my-2">
              <View className="flex-1 h-[1px] bg-border" />
              <Text className="text-[11px] text-text-tertiary">ou</Text>
              <View className="flex-1 h-[1px] bg-border" />
            </View>

            <View className="flex-row justify-center gap-1 mt-2">
              <Text className="text-text-secondary">Déjà un compte ?</Text>
              <Link href="/sign-in" asChild>
                <Text className="text-primary font-semibold">Se connecter</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
