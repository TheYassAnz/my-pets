import { hideSplash } from '@/lib/splash';

describe('hideSplash', () => {
  const realDocument = globalThis.document;

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.useRealTimers();
    globalThis.document = realDocument;
  });

  it('ajoute splash-hide puis retire l\'élément à 250 ms', () => {
    const el = { classList: { add: jest.fn() }, remove: jest.fn() };
    globalThis.document = { getElementById: () => el } as unknown as Document;

    hideSplash();

    expect(el.classList.add).toHaveBeenCalledWith('splash-hide');
    jest.advanceTimersByTime(249);
    expect(el.remove).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(el.remove).toHaveBeenCalledTimes(1);
  });

  it('ne lève pas sans document ni sans #splash', () => {
    // @ts-expect-error simule un environnement sans DOM
    delete globalThis.document;
    expect(() => hideSplash()).not.toThrow();

    globalThis.document = { getElementById: () => null } as unknown as Document;
    expect(() => hideSplash()).not.toThrow();
  });
});
