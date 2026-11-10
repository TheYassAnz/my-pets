import { render, screen } from '@testing-library/react-native';

import { Text } from '@/components/ui/text';

describe('Text', () => {
  // Un tableau serait réutilisé par React Compiler et muté par NativeWind web :
  // les classes s'empileraient à chaque changement de className.
  it('transmet un style objet, jamais un tableau', async () => {
    await render(
      <Text className="font-bold text-text" style={[{ opacity: 0.5 }]}>
        Bonjour
      </Text>,
    );

    const { style } = screen.getByText('Bonjour').props;
    expect(Array.isArray(style)).toBe(false);
    expect(style).toMatchObject({ fontFamily: 'Nunito_800ExtraBold', opacity: 0.5 });
  });
});
