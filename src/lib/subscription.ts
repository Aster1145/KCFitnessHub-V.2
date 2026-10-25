import type { Membership } from "@/db/schema";
import { addDaysStr, daysBetween } from "./dates";

export interface SubStatus {
  /** calendar days elapsed since start (inclusive of today) */
  elapsed: number;
  /** attended sessions that consume the subscription */
  used: number;
  /** attended sessions that count (capped at duration) */
  attended: number;
  /** missed days — each one pushes the end date out by one day */
  absent: number;
  /** auto-adjusted end date (start + duration + absent days) */
  endDate: string;
  /** originally promised end date */
  promisedEnd: string;
  remaining: number;
  pct: number;
  active: boolean;
  totalDays: number;
}

/**
 * Attendance-billing engine: a subscription promises N attended sessions.
 * Only days the member actually checks in consume the plan — every absent
 * day automatically extends the end date by one day.
 */
export function computeSubscription(
  m: Membership,
  attendedDates: string[],
  today: string
): SubStatus {
  const attendedInWindow = attendedDates.filter(
    (d) => d >= m.startDate && d <= today
  ).length;

  const elapsed = Math.max(0, daysBetween(m.startDate, today) + 1);
  const used = Math.min(attendedInWindow, m.durationDays);
  const absent = Math.max(0, elapsed - attendedInWindow);
  const remaining = Math.max(0, m.durationDays - used);

  return {
    elapsed,
    used,
    attended: attendedInWindow,
    absent,
    promisedEnd: addDaysStr(m.startDate, m.durationDays - 1),
    endDate: addDaysStr(m.startDate, m.durationDays - 1 + absent),
    remaining,
    pct: Math.round((used / m.durationDays) * 100),
    active: remaining > 0,
    totalDays: m.durationDays,
  };
}

export function currentStreak(
  attended: Set<string>,
  today: string
): number {
  let streak = 0;
  let cursor = attended.has(today) ? today : addDaysStr(today, -1);
  while (attended.has(cursor)) {
    streak++;
    cursor = addDaysStr(cursor, -1);
  }
  return streak;
}
