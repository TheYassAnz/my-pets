import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Input } from '@/components/ui';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!email) {
      setError('Email requis');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      await api.forgotPassword(normalizedEmail);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const openMailApp = () => {
    Linking.openURL('message:');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-sunken">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6 py-4 justify-between">
        <View>
          {/* Bouton Retour Circulaire */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            className="w-[34px] h-[34px] rounded-full items-center justify-center bg-surface border border-border">
            <Icon name="chevron-left" size={16} color="rgb(var(--color-text))" />
          </Pressable>

          {!sent ? (
            <View className="mt-4 gap-4">
              <Text className="text-[27px] font-medium tracking-tight text-text">
                Mot de passe oublié
              </Text>
              <Text className="text-[14px] text-text-secondary leading-relaxed">
                Entrez votre adresse e-mail pour recevoir les instructions de réinitialisation.
              </Text>

              <View className="mt-2 gap-4">
                <Input
                  label="E-mail"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={onSubmit}
                />

                {error ? <Text className="text-body text-danger">{error}</Text> : null}

                <Button
                  label="Envoyer le lien"
                  variant="primary"
                  loading={submitting}
                  onPress={onSubmit}
                />
              </View>
            </View>
          ) : (
            /* Écran 14 : Confirmation - Lien envoyé */
            <View className="items-center text-center mt-16 px-4">
              <View className="w-16 h-16 rounded-full items-center justify-center bg-brand/20 border border-brand/40 mb-6">
                <Icon name="bell" size={26} color="rgb(var(--color-primary))" />
              </View>

              <Text className="text-[21px] font-medium tracking-tight text-text text-center">
                Vérifiez vos e-mails
              </Text>

              <Text className="text-[14px] text-text-secondary leading-relaxed text-center mt-3 max-w-[280px]">
                Un lien de réinitialisation a été envoyé à{' '}
                <Text className="text-text font-medium">{email}</Text>. Il expire dans 30 minutes.
              </Text>

              <Text className="text-[13px] text-text-tertiary mt-3 mb-8">
                Renvoyer dans 00:42
              </Text>

              <View className="w-full gap-3">
                <Button
                  label="Ouvrir l'application Mail"
                  variant="secondary"
                  onPress={openMailApp}
                />
                <Button
                  label="Saisir un code de réinitialisation"
                  variant="ghost"
                  onPress={() =>
                    router.push({
                      pathname: '/reset-password',
                      params: { email },
                    })
                  }
                />
              </View>
            </View>
          )}
        </View>

        <View className="flex-row justify-center items-center gap-1 my-4">
          <Text className="text-text-secondary text-caption">Vous vous souvenez ?</Text>
          <Button variant="ghost" label="Se connecter" onPress={() => router.push('/sign-in')} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
