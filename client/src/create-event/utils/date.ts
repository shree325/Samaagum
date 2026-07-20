// @ts-nocheck
// ─── Date Utilities ───────────────────────────────────────────────────────────
// Pure functions for date arithmetic used in CreateEventForm.

/** Returns today's date as a YYYY-MM-DD string. */
export function todayStr(): string {
  const now = new Date();
  return formatYMD(now);
}

/** Formats a Date object as YYYY-MM-DD. */
export function formatYMD(d: Date): string {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes the default start / end date+time for a new event based on the
 * current wall clock.  Rounds minutes to the nearest 5.
 */
export function computeInitDT(): {
  currentDate: string;
  currentTime: string;
  endDateStr: string;
  currentEndTime: string;
} {
  const now = new Date();
  const currentDate = formatYMD(now);

  let currentHour   = now.getHours();
  let currentMinute = Math.round(now.getMinutes() / 5) * 5;
  if (currentMinute === 60) { currentMinute = 0; currentHour = (currentHour + 1) % 24; }
  const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  let endHour = (currentHour + 1) % 24;
  const currentEndTime = `${String(endHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  let endDateStr = currentDate;
  if (currentHour === 23) {
    const endNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    endDateStr = formatYMD(endNow);
  }

  return { currentDate, currentTime, endDateStr, currentEndTime };
}

/**
 * Extracts local date and time strings from an ISO timestamp without UTC
 * shift artefacts.  Returns empty strings if the value is falsy.
 */
export function extractLocalDateTime(isoStr: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!isoStr) return { date: '', time: '' };
  const d = new Date(isoStr);
  const date = formatYMD(d);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

/**
 * If a given YYYY-MM-DD string is in the past (before today), returns today's
 * date string.  Otherwise returns the original string unchanged.
 */
export function clampToToday(dateStr: string): string {
  const today = todayStr();
  return dateStr && dateStr < today ? today : dateStr;
}

/**
 * Clamps a HH:mm time string to "now" if the given date is today and the
 * time is already in the past.  Returns the original time if not applicable.
 */
export function clampTimeToNow(dateStr: string, timeStr: string): string {
  const today = todayStr();
  if (dateStr !== today || !timeStr) return timeStr;

  const [sh, sm] = timeStr.split(':').map(Number);
  const now = new Date();
  const nowH = now.getHours();
  const nowM = now.getMinutes();

  if (sh < nowH || (sh === nowH && sm < nowM)) {
    let h = nowH;
    let m = Math.round(nowM / 5) * 5;
    if (m === 60) { m = 0; h = (h + 1) % 24; }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return timeStr;
}
