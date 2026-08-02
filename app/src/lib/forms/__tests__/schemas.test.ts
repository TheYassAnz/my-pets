import { animalSchema, healthEventSchema, signInSchema, signUpSchema } from '@/lib/forms/schemas';

function messageFor(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message;
}

describe('signInSchema', () => {
  it('exige chaque champ séparément', () => {
    const result = signInSchema.safeParse({ email: '', password: '' });

    expect(messageFor(result, 'email')).toBe('Email requis');
    expect(messageFor(result, 'password')).toBe('Mot de passe requis');
  });

  it('accepte une saisie complète', () => {
    expect(signInSchema.safeParse({ email: 'a@b.fr', password: 'motdepasse' }).success).toBe(true);
  });
});

describe('signUpSchema', () => {
  it('signale un mot de passe vide comme requis avant d’invoquer la longueur', () => {
    const result = signUpSchema.safeParse({ email: 'a@b.fr', password: '', confirm: '' });

    expect(messageFor(result, 'password')).toBe('Mot de passe requis');
  });

  it('conserve le message de longueur existant', () => {
    const result = signUpSchema.safeParse({ email: 'a@b.fr', password: 'court', confirm: 'court' });

    expect(messageFor(result, 'password')).toBe(
      'Le mot de passe doit faire au moins 8 caractères',
    );
  });

  it('rattache la non-correspondance au champ de confirmation', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.fr',
      password: 'motdepasse',
      confirm: 'autre-chose',
    });

    expect(messageFor(result, 'confirm')).toBe('Les mots de passe ne correspondent pas');
  });
});

describe('animalSchema', () => {
  const valid = {
    name: 'Rex',
    speciesChoice: 'Chien' as const,
    speciesOther: '',
    birthDate: null,
  };

  it('accepte un animal sans date de naissance', () => {
    expect(animalSchema.safeParse(valid).success).toBe(true);
  });

  it('exige le nom', () => {
    const result = animalSchema.safeParse({ ...valid, name: '   ' });

    expect(messageFor(result, 'name')).toBe('Nom requis');
  });

  it('exige la précision quand l’espèce est « Autre »', () => {
    const result = animalSchema.safeParse({
      ...valid,
      speciesChoice: 'Autre' as const,
      speciesOther: '  ',
    });

    expect(messageFor(result, 'speciesOther')).toBe('Espèce requise');
  });

  it('refuse une date de naissance dans le futur', () => {
    const nextYear = new Date().getFullYear() + 1;
    const result = animalSchema.safeParse({ ...valid, birthDate: `${nextYear}-01-01` });

    expect(messageFor(result, 'birthDate')).toBe(
      'La date de naissance ne peut pas être dans le futur',
    );
  });
});

describe('healthEventSchema', () => {
  const valid = {
    type: 'VACCINE' as const,
    title: 'Rage',
    date: '2026-03-12',
    dosage: '',
    vet: '',
    notes: '',
    nextDueDate: null,
  };

  it('accepte un événement minimal', () => {
    expect(healthEventSchema.safeParse(valid).success).toBe(true);
  });

  it('conserve le message de titre existant', () => {
    const result = healthEventSchema.safeParse({ ...valid, title: '  ' });

    expect(messageFor(result, 'title')).toBe('Titre requis');
  });

  it('exige une date', () => {
    const result = healthEventSchema.safeParse({ ...valid, date: '' });

    expect(messageFor(result, 'date')).toBe('Date requise');
  });
});
