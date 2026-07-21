import * as UI from '@/components/ui';

describe('barrel export de la librairie UI', () => {
  it('expose tous les composants du Lot 2', async () => {
    const expected = [
      'Button',
      'Card',
      'Chip',
      'EmptyState',
      'ErrorState',
      'FAB',
      'Icon',
      'Input',
      'ListRow',
      'SegmentedControl',
      'Skeleton',
      'ToastProvider',
      'useToast',
    ];

    for (const name of expected) {
      expect(UI).toHaveProperty(name);
    }
  });
});
