import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.join(__dirname, '../../public/index.html'), 'utf8');
const code = /<script id="splash-fun-script">([\s\S]*?)<\/script>/.exec(html)?.[1];

describe('phrases rotatives du splash', () => {
  const realDocument = globalThis.document;
  let el: { textContent: string; classList: { add: jest.Mock; remove: jest.Mock } };
  let splashPresent: boolean;

  const run = ({ withFun = true } = {}) => {
    globalThis.document = {
      getElementById: (id: string) =>
        id === 'splash-fun' ? (withFun ? el : null) : id === 'splash' && splashPresent ? {} : null,
    } as unknown as Document;
    new Function(code as string)();
  };
  // 1er appel : 2000 + 200 ms (fire + fin du fondu) ; ensuite 2000 ms pour rester calé sur le cycle.
  let ticks: number;
  const tick = () => {
    jest.advanceTimersByTime(ticks++ ? 2000 : 2200);
    return el.textContent;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    splashPresent = true;
    ticks = 0;
    el = { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } };
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    globalThis.document = realDocument;
  });

  it('affiche une phrase immédiatement', () => {
    run();
    expect(el.textContent).toMatch(/…$/);
  });

  it('change de phrase toutes les 2 s avec un fondu de 200 ms', () => {
    run();
    const first = el.textContent;
    jest.advanceTimersByTime(2000);
    expect(el.classList.add).toHaveBeenCalledWith('splash-fun-out');
    expect(el.textContent).toBe(first);
    jest.advanceTimersByTime(200);
    expect(el.classList.remove).toHaveBeenCalledWith('splash-fun-out');
    expect(el.textContent).not.toBe(first);
  });

  it('montre toute la liste (12-15 phrases) sans répétition dans un cycle', () => {
    run();
    const seen = [el.textContent, ...Array.from({ length: 99 }, tick)];
    const all = new Set(seen);
    expect(all.size).toBeGreaterThanOrEqual(12);
    expect(all.size).toBeLessThanOrEqual(15);
    expect(new Set(seen.slice(0, all.size)).size).toBe(all.size);
    expect(all).toContain('Nettoyage des litières…');
    expect(all).toContain('Ravitaillement des croquettes…');
  });

  it("jamais deux fois la même phrase d'affilée", () => {
    run();
    const seen = [el.textContent, ...Array.from({ length: 200 }, tick)];
    seen.slice(1).forEach((t, i) => expect(t).not.toBe(seen[i]));
  });

  it('stoppe quand #splash disparaît', () => {
    run();
    splashPresent = false;
    expect(() => tick()).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('ne lève pas sans #splash-fun', () => {
    expect(() => run({ withFun: false })).not.toThrow();
    expect(jest.getTimerCount()).toBe(0);
  });
});
