import { type ReactNode } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './button';

export type WizardProps = {
  children: ReactNode;
  onNext?: () => void;
  nextLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  hideFooter?: boolean;
};

export function Wizard({
  children,
  onNext,
  nextLabel = 'Suivant',
  loading,
  disabled,
  hideFooter,
}: WizardProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-surface" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerClassName="flex-grow p-4 pt-8 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {!hideFooter && onNext && (
        <View 
          className="border-t border-border bg-surface px-4 pt-4" 
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Button 
            label={nextLabel} 
            onPress={onNext} 
            loading={loading} 
            disabled={disabled} 
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
