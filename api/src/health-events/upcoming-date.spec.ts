import { upcomingDate } from './upcoming-date';

const day = 86_400_000;
const from = new Date('2026-11-12T00:00:00Z');
const to = new Date(from.getTime() + 90 * day);
const at = (n: number) => new Date(from.getTime() + n * day);

describe('upcomingDate', () => {
  it('visite planifiée sans prochaine échéance : sa date', () => {
    expect(upcomingDate({ date: at(17), nextDueDate: null }, from, to)).toEqual(
      at(17),
    );
  });

  it('événement passé : sa prochaine échéance', () => {
    expect(
      upcomingDate({ date: at(-30), nextDueDate: at(10) }, from, to),
    ).toEqual(at(10));
  });

  it('date et échéance dans la fenêtre : la plus proche', () => {
    expect(
      upcomingDate({ date: at(20), nextDueDate: at(5) }, from, to),
    ).toEqual(at(5));
    expect(
      upcomingDate({ date: at(5), nextDueDate: at(60) }, from, to),
    ).toEqual(at(5));
  });

  it("bornes incluses : aujourd'hui et le dernier jour", () => {
    expect(upcomingDate({ date: at(0), nextDueDate: null }, from, to)).toEqual(
      at(0),
    );
    expect(
      upcomingDate({ date: at(-1), nextDueDate: at(90) }, from, to),
    ).toEqual(at(90));
  });

  it('rien dans la fenêtre : null', () => {
    expect(
      upcomingDate({ date: at(-1), nextDueDate: at(91) }, from, to),
    ).toBeNull();
    expect(
      upcomingDate({ date: at(-1), nextDueDate: null }, from, to),
    ).toBeNull();
  });
});
