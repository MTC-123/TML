/**
 * MAD (Moroccan Dirham) currency formatting utilities.
 */

const MAD_FORMATTER = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MAD_COMPACT_FORMATTER = new Intl.NumberFormat("fr-MA", {
  style: "currency",
  currency: "MAD",
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

/**
 * Format a numeric value as MAD currency.
 * Accepts number or string (Prisma Decimal serialization).
 */
export function formatMAD(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "— MAD";
  return MAD_FORMATTER.format(num);
}

/**
 * Format a numeric value as compact MAD (e.g., 1.2M MAD).
 */
export function formatMADCompact(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "— MAD";
  return MAD_COMPACT_FORMATTER.format(num);
}

/**
 * Parse a MAD-formatted string back to a number.
 * Returns NaN if parsing fails.
 */
export function parseMAD(formatted: string): number {
  const cleaned = formatted.replace(/[^\d.,-]/g, "").replace(",", ".");
  return parseFloat(cleaned);
}
