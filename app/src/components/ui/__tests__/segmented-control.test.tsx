import { render, screen, fireEvent } from '@testing-library/react-native';

import { SegmentedControl } from '@/components/ui/segmented-control';

const OPTIONS = [
  { value: 'VACCINE', label: 'Vaccin' },
  { value: 'TREATMENT', label: 'Traitement' },
  { value: 'VISIT', label: 'Visite' },
];

describe('SegmentedControl', () => {
  it('remonte la valeur choisie', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={OPTIONS} value="VACCINE" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Traitement' }));

    expect(onChange).toHaveBeenCalledWith('TREATMENT');
  });

  it('marque l’option courante comme sélectionnée', async () => {
    await render(<SegmentedControl options={OPTIONS} value="VACCINE" onChange={jest.fn()} />);

    expect(
      screen.getByRole('radio', { name: 'Vaccin' }).props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByRole('radio', { name: 'Visite' }).props.accessibilityState.selected,
    ).toBe(false);
  });

  it('met en avant le segment actif sur un fond de surface', async () => {
    await render(<SegmentedControl options={OPTIONS} value="VACCINE" onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: 'Vaccin' }).props.className).toContain('bg-surface');
    expect(screen.getByRole('radio', { name: 'Visite' }).props.className).not.toContain(
      'bg-surface',
    );
  });
});
