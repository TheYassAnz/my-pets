import { fireEvent, render, screen } from '@testing-library/react-native';

import { DateField } from '@/components/ui/date-field.web';

// jest-expo cible iOS : le rendu DOM est vérifié via l'élément React renvoyé.
describe('DateField web', () => {
  it('rend un input type=date portant la valeur AAAA-MM-JJ et borné par min/max', async () => {
    await render(
      <DateField
        label="Date"
        value="2026-03-12"
        onChange={jest.fn()}
        minimumDate={new Date(2020, 0, 5)}
        maximumDate={new Date(2030, 11, 31)}
      />,
    );
    const input = screen.queryByLabelText('Date');
    expect(input).toBeTruthy();
    expect(input!.props).toMatchObject({
      type: 'date',
      value: '2026-03-12',
      min: '2020-01-05',
      max: '2030-12-31',
    });
  });

  it('transmet la valeur saisie telle quelle, ou null si le champ est vidé', async () => {
    const onChange = jest.fn();
    await render(<DateField label="Date" value={null} onChange={onChange} />);
    const input = screen.getByLabelText('Date');
    input.props.onChange({ target: { value: '2026-04-01' } });
    input.props.onChange({ target: { value: '' } });
    expect(onChange).toHaveBeenNthCalledWith(1, '2026-04-01');
    expect(onChange).toHaveBeenNthCalledWith(2, null);
  });

  it('« Effacer » vide la valeur uniquement si effaçable et renseigné', async () => {
    const onChange = jest.fn();
    await render(<DateField label="Rappel" value="2026-03-12" onChange={onChange} clearable />);
    fireEvent.press(screen.getByLabelText('Effacer Rappel'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
