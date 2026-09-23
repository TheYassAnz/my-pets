import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, Input } from '@/components/ui';
import { api } from '@/lib/api';

export default function ResetPasswordScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(emailParam ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || code.length !== 6 || !newPassword) {
      setError('Email, code à 6 chiffres et nouveau mot de passe requis');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.resetPassword(email.trim().toLowerCase(), code, newPassword);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Réinitialisation impossible');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-surface-sunken">
        <View className="flex-1 justify-center items-center px-8 gap-4">
          <View className="w-16 h-16 rounded-full items-center justify-center bg-brand/20 border border-brand/40 mb-4">
            <Icon name="check" size={28} color="rgb(var(--color-primary))" />
          </View>
          <Text className="text-[22px] font-medium text-text text-center">
            Mot de passe mis à jour
          </Text>
          <Text className="text-[14px] text-text-secondary text-center mb-6 leading-relaxed">
            Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
          </Text>
          <Button
            label="Se connecter"
            variant="primary"
            className="w-full"
            onPress={() => router.replace('/sign-in')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-sunken">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 }}>
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => router.back()}
              className="w-[34px] h-[34px] rounded-full items-center justify-center bg-surface border border-border">
              <Icon name="chevron-left" size={16} color="rgb(var(--color-text))" />
            </Pressable>

            <Text className="text-[27px] font-medium tracking-tight text-text mt-4 mb-2">
              Nouveau mot de passe
            </Text>
            <Text className="text-[14px] text-text-secondary mb-6 leading-relaxed">
              Entrez le code reçu par email et votre nouveau mot de passe.
            </Text>

            <View className="gap-3.5">
              <Input
                label="E-mail"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <Input
                label="Code à 6 chiffres"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
              <Input
                label="Nouveau mot de passe"
                secureTextEntry
                autoComplete="new-password"
                value={newPassword}
                onChangeText={setNewPassword}
                onSubmitEditing={onSubmit}
              />

              {error ? <Text className="text-body text-danger">{error}</Text> : null}

              <Button
                label="Réinitialiser"
                variant="primary"
                className="mt-3"
                loading={submitting}
                onPress={onSubmit}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
