import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthPortraits } from '@/components/auth-portraits';
import { Button, Checkbox, FormField } from '@/components/ui';
import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/auth-context';
import { signUpSchema, type SignUpValues } from '@/lib/forms/schemas';

export default function SignUpScreen() {
  const { signUp } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

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
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
          <View>
            <AuthPortraits />
            <Text accessibilityRole="header" className="mb-6 text-[32px] font-bold text-text">
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
                            step <= passwordStrength ? 'bg-primary' : 'bg-border'
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
                <Checkbox checked={acceptedTerms} onCheckedChange={setAcceptedTerms} accessibilityLabel="Accepter les conditions d’utilisation" />
                <Text className="flex-1 text-[12px] leading-relaxed text-text-secondary">
                  J'accepte les conditions d'utilisation et la politique de confidentialité.
                </Text>
              </Pressable>

              {error ? <Text className="text-body text-danger">{error}</Text> : null}
            </View>
          </View>

          <View>
            <Button label="Continuer" variant="primary" loading={formState.isSubmitting} onPress={onSubmit} />
            <View className="mt-4 flex-row items-center justify-center gap-1">
              <Text className="text-[15px] text-text-secondary">Déjà un compte ?</Text>
              <Text
                accessibilityRole="link"
                onPress={() => router.replace('/sign-in')}
                className="min-h-[44px] py-3 text-[15px] font-bold text-text">
                Se connecter
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
