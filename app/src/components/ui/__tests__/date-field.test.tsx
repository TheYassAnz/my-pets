import { fireEvent, render, screen } from '@testing-library/react-native';

import { DateField } from '@/components/ui/date-field';

describe('DateField', () => {
  it('affiche le libellé et le texte de remplacement quand aucune date n’est choisie', async () => {
    await render(
      <DateField label="Date" value={null} onChange={jest.fn()} placeholder="Optionnelle" />,
    );

    expect(screen.getByText('Date')).toBeTruthy();
    expect(screen.getByText('Optionnelle')).toBeTruthy();
  });

  it('affiche la date en format long français, jamais en ISO (PET-5)', async () => {
    await render(<DateField label="Date" value="2026-03-12" onChange={jest.fn()} />);

    expect(screen.getByText('12 mars 2026')).toBeTruthy();
    expect(screen.queryByText('2026-03-12')).toBeNull();
  });

  it('intègre l’erreur au nom accessible du champ', async () => {
    await render(
      <DateField label="Date" value={null} onChange={jest.fn()} error="Date requise" />,
    );

    expect(screen.getByText('Date requise')).toBeTruthy();
    expect(screen.getByLabelText('Date, aucune date, erreur : Date requise')).toBeTruthy();
  });

  it('n’expose « Effacer » que si le champ est effaçable et renseigné', async () => {
    const onChange = jest.fn();
    await render(
      <DateField label="Prochain rappel" value="2026-03-12" onChange={onChange} clearable />,
    );

    fireEvent.press(screen.getByLabelText('Effacer Prochain rappel'));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('n’expose pas « Effacer » quand aucune date n’est renseignée', async () => {
    await render(
      <DateField label="Prochain rappel" value={null} onChange={jest.fn()} clearable />,
    );

    expect(screen.queryByLabelText('Effacer Prochain rappel')).toBeNull();
  });
});
