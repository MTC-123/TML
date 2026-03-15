/**
 * Date formatting utilities using Intl.DateTimeFormat.
 * Avoids external dependency on date-fns for these simple cases.
 */

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

const ISO_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

/**
 * Format a date as "February 10, 2026".
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return FULL_DATE_FORMATTER.format(d);
}

/**
 * Format a date as "Feb 10, 2026".
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return SHORT_DATE_FORMATTER.format(d);
}

/**
 * Format a date with time as "February 10, 2026 at 02:32 PM UTC".
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return ISO_DATE_TIME_FORMATTER.format(d);
}

/**
 * Format a date with time in the user's local timezone.
 */
export function formatDateTimeLocal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return DATE_TIME_FORMATTER.format(d);
}

/**
 * Return a human-readable relative time string (e.g., "2 hours ago", "in 3 days").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "Invalid date";

  const now = Date.now();
  const diffMs = d.getTime() - now;
  const absDiffMs = Math.abs(diffMs);

  const seconds = Math.floor(absDiffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (days > 0) return rtf.format(diffMs > 0 ? days : -days, "day");
  if (hours > 0) return rtf.format(diffMs > 0 ? hours : -hours, "hour");
  if (minutes > 0) return rtf.format(diffMs > 0 ? minutes : -minutes, "minute");
  return rtf.format(diffMs > 0 ? seconds : -seconds, "second");
}
