// Date à rappeler d'un événement : sa date s'il est planifié, sinon sa prochaine
// échéance — la plus proche des deux qui tombe dans [from, to] (bornes incluses).
export function upcomingDate(
  event: { date: Date; nextDueDate: Date | null },
  from: Date,
  to: Date,
): Date | null {
  const inWindow = [event.date, event.nextDueDate].filter(
    (d): d is Date => !!d && d >= from && d <= to,
  );
  if (inWindow.length === 0) return null;
  return new Date(Math.min(...inWindow.map((d) => d.getTime())));
}
