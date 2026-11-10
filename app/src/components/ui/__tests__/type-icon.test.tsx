import { render, screen } from '@testing-library/react-native';

import { TypeIcon } from '@/components/ui/type-icon';
import { Colors } from '@/constants/theme';

describe('TypeIcon', () => {
  it.each([
    ['VACCINE', Colors.light.typeVaccineFg],
    ['TREATMENT', Colors.light.typeTreatmentFg],
    ['VISIT', Colors.light.typeVisitFg],
    ['WEIGHT', Colors.light.typeWeightFg],
  ] as const)('rend l’icône %s avec sa couleur de type', async (type, fg) => {
    await render(<TypeIcon type={type} testID="t" />);
    const node = screen.getByTestId('t-icon', { includeHiddenElements: true });
    const color = [node.props.style].flat().find((s) => s && 'color' in s)?.color;
    expect(color).toBe(fg);
  });
});
