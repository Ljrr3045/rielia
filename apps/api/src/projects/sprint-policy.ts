import { isPlanningTimeZone, isSprintDate } from '@rielia/contracts';

/** Local date boundaries must resolve to exactly one instant. No browser zone or UTC-day arithmetic. */
export function sprintMidnight(date: string, timeZone: string): Date {
  if (!isSprintDate(date) || !isPlanningTimeZone(timeZone))
    throw new Error('Invalid sprint date or time zone.');
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    era: 'short',
    hourCycle: 'h23',
  });
  const parts = (instant: number) => {
    const raw = formatter.formatToParts(instant);
    const values = Object.fromEntries(
      raw
        .filter((p) => p.type !== 'literal' && p.type !== 'era')
        .map((p) => [p.type, Number(p.value)]),
    );
    if (raw.some((p) => p.type === 'era' && p.value === 'BC')) values['year'] = 1 - values['year']!;
    return values;
  };
  const epoch = (p: Record<string, number>) => {
    const d = new Date(0);
    d.setUTCFullYear(p['year']!, p['month']! - 1, p['day']!);
    d.setUTCHours(p['hour']!, p['minute']!, p['second']!, 0);
    return d.getTime();
  };
  const nominal = new Date(`${date}T00:00:00.000Z`).getTime();
  // Discover the offsets on both sides of any boundary transition, including
  // full-day skips. Candidate round trips, not offset guesses, decide validity.
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    const probe = nominal + hours * 3600000;
    offsets.add(epoch(parts(probe)) - probe);
  }
  const candidates = [...offsets]
    .map((offset) => nominal - offset)
    .filter((value) => {
      const p = parts(value);
      return (
        `${String(p['year']).padStart(4, '0')}-${String(p['month']).padStart(2, '0')}-${String(p['day']).padStart(2, '0')}` ===
          date &&
        p['hour'] === 0 &&
        p['minute'] === 0 &&
        p['second'] === 0
      );
    });
  if (candidates.length !== 1)
    throw new Error('Sprint midnight is nonexistent or ambiguous in this time zone.');
  return new Date(candidates[0]!);
}
