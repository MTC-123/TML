const defaults: Record<string, string> = {
  NEXT_PUBLIC_API_URL: "http://localhost:3001",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

export function getEnv(key: string): string {
  if (typeof window !== "undefined") {
    const val =
      (window as unknown as Record<string, unknown>)[`__ENV_${key}`] ??
      process.env[key] ??
      defaults[key];
    if (val === undefined) throw new Error(`Missing env: ${key}`);
    return String(val);
  }
  const val = process.env[key] ?? defaults[key];
  if (val === undefined) throw new Error(`Missing env: ${key}`);
  return val;
}

export const API_URL = (): string => getEnv("NEXT_PUBLIC_API_URL");
export const APP_URL = (): string => getEnv("NEXT_PUBLIC_APP_URL");
