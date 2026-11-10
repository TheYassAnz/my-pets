import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { FormField } from '@/components/ui/form-field';

const schema = z.object({ name: z.string().trim().min(1, 'Nom requis') });

function Harness() {
  const { control } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: '' },
  });

  return (
    <View>
      <FormField control={control} name="name" label="Nom" />
    </View>
  );
}

describe('FormField', () => {
  it('rend le champ avec son label', async () => {
    await render(<Harness />);

    expect(screen.getByText('Nom')).toBeTruthy();
  });

  it('n’affiche aucune erreur avant que le champ ait été touché', async () => {
    await render(<Harness />);

    expect(screen.queryByText('Nom requis')).toBeNull();
  });

  it('valide à la perte du focus et affiche l’erreur sous le champ', async () => {
    // Comportement demandé par PET-6 : l'erreur apparaît au blur, pas seulement
    // à la soumission.
    await render(<Harness />);

    fireEvent(screen.getByLabelText('Nom'), 'blur');

    await waitFor(() => expect(screen.getByText('Nom requis')).toBeTruthy());
  });

  it('efface l’erreur dès que le champ est corrigé', async () => {
    await render(<Harness />);

    fireEvent(screen.getByLabelText('Nom'), 'blur');
    await waitFor(() => expect(screen.getByText('Nom requis')).toBeTruthy());

    fireEvent.changeText(screen.getByLabelText('Nom, erreur : Nom requis'), 'Rex');

    await waitFor(() => expect(screen.queryByText('Nom requis')).toBeNull());
  });
});
