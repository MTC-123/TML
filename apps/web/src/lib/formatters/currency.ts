/**
 * Format a number as Moroccan Dirham (MAD).
 */
export function formatMAD(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "— MAD";
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Compact format — e.g., "45M MAD"
 */
export function formatMADCompact(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "— MAD";
  if (num >= 1_000_000_000)
    return `${(num / 1_000_000_000).toFixed(1)}B MAD`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M MAD`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K MAD`;
  return formatMAD(num);
}

/**
 * Parse a MAD-formatted string to a number.
 */
export function parseMAD(formatted: string): number {
  const cleaned = formatted.replace(/[^0-9.,\-]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}
