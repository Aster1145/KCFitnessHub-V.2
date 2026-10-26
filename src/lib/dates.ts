// Local-date helpers (all dates are stored as "yyyy-mm-dd" strings)

export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

/** Whole days from a to b (b - a). Positive when b is after a. */
export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + "T00:00:00").getTime() -
      new Date(a + "T00:00:00").getTime()) /
      86400000
  );
}

export function prettyDate(s: string | Date): string {
  const d = typeof s === "string" ? new Date(s + "T00:00:00") : s;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function prettyDateTime(d: Date): string {
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function monthKey(s: string | Date): string {
  const d = typeof s === "string" ? new Date(s) : s;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
  });
}

export function lastNDays(n: number, end: string = todayStr()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDaysStr(end, -i));
  return out;
}

export function weekdayShort(s: string): string {
  return new Date(s + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

export const todayDateString = todayStr;

export function inr(n: number): string {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}
