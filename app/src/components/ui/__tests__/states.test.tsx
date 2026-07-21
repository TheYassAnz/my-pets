import { render, screen, fireEvent } from '@testing-library/react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

describe('EmptyState', () => {
  it('affiche le titre et le message', async () => {
    await render(<EmptyState icon="paw" title="Aucun animal" message="Ajoutez votre premier compagnon." />);

    expect(screen.getByText('Aucun animal')).toBeTruthy();
    expect(screen.getByText('Ajoutez votre premier compagnon.')).toBeTruthy();
  });

  it('déclenche l’action quand elle est fournie', async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState icon="paw" title="Aucun animal" actionLabel="Ajouter" onAction={onAction} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('n’affiche pas de bouton sans action', async () => {
    await render(<EmptyState icon="paw" title="Aucun animal" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ErrorState', () => {
  it('affiche le message et permet de réessayer', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Chargement impossible" onRetry={onRetry} />);

    expect(screen.getByText('Chargement impossible')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('n’affiche pas de bouton quand aucun retry n’est possible', async () => {
    await render(<ErrorState message="Chargement impossible" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Skeleton', () => {
  it('se déclare occupé aux lecteurs d’écran', async () => {
    await render(<Skeleton />);

    expect(screen.getByLabelText('Chargement en cours')).toBeTruthy();
  });

  it('rend le nombre de placeholders demandé', async () => {
    await render(<Skeleton count={3} testID="skeleton" />);

    expect(screen.getAllByTestId('skeleton-item')).toHaveLength(3);
  });
});
