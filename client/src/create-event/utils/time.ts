// @ts-nocheck
// ─── Time Utilities ───────────────────────────────────────────────────────────
// Pure functions for converting, formatting, and arithmetic on time strings.
// All inputs/outputs use HH:mm 24-hour strings unless stated otherwise.

import { TIMEZONES } from '../constants';

/**
 * Converts a 24-hour time string (HH:mm) to a 12-hour display string.
 * e.g. "14:30" → "02:30 PM"
 */
export function format24to12(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
}

/**
 * Parses a user-typed time string (12-hour or 24-hour) into HH:mm 24-hour.
 * Returns null if the string cannot be parsed.
 */
export function parse12to24(val: string): string | null {
  if (!val) return null;
  const match = val.match(/^\s*(\d{1,2})\s*:\s*(\d{2})\s*(am|pm)?\s*$/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toLowerCase() : null;
  if (h < 1 || h > 12 || m < 0 || m > 59) {
    if (!ampm && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return null;
  }
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Adds one hour to a HH:mm string and returns the new HH:mm string.
 * Wraps around midnight.
 */
export function addOneHour(timeStr: string): string {
  if (!timeStr) return '10:00';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;
  h = (h + 1) % 24;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Returns a human-readable duration string between two date+time pairs.
 * e.g. "2 hours 30 mins"
 */
export function getDurationText(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): string {
  if (!startDate || !startTime || !endDate || !endTime) return '';
  try {
    const start = new Date(`${startDate}T${startTime}`);
    const end   = new Date(`${endDate}T${endTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    const diffMs   = end.getTime() - start.getTime();
    if (diffMs <= 0) return '';
    const diffMins = Math.floor(diffMs / 60000);
    const hrs  = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    let text = '';
    if (hrs  > 0) text += `${hrs} ${hrs  === 1 ? 'hour'  : 'hours'}`;
    if (mins > 0) { if (text) text += ' '; text += `${mins} ${mins === 1 ? 'min' : 'mins'}`; }
    return text;
  } catch {
    return '';
  }
}

/**
 * Returns { main, city } for a timezone value string.
 */
export function getTzInfo(tzValue: string): { main: string; city: string } {
  const mapping: Record<string, { main: string; city: string }> = {
    'UTC +05:30 India':       { main: 'GMT+05:30', city: 'Asia/Kolkata' },
    'UTC +00:00 London':      { main: 'GMT+00:00', city: 'Europe/London' },
    'UTC -05:00 New York':    { main: 'GMT-05:00', city: 'America/New_York' },
    'UTC +08:00 Singapore':   { main: 'GMT+08:00', city: 'Asia/Singapore' },
    'UTC +09:00 Tokyo':       { main: 'GMT+09:00', city: 'Asia/Tokyo' },
    'UTC -08:00 Los Angeles': { main: 'GMT-08:00', city: 'America/Los_Angeles' },
  };
  return mapping[tzValue] || { main: tzValue || 'GMT+05:30', city: 'Asia/Kolkata' };
}
