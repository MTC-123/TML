const ALLOWED_CHARS = /[^0-9*#]/g;
const MAX_LENGTH = 50;

export function sanitizeUssdInput(raw: string): string {
  return raw.replace(ALLOWED_CHARS, '').slice(0, MAX_LENGTH);
}

export function sanitizeProjectCode(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 6 ? digits : null;
}

export function sanitizeOtp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 6 ? digits : null;
}
