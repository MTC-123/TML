import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_MOSIP_CLIENT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_MOSIP_ISSUER_URL: z.string().url().optional(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["en", "fr", "ar", "tzm"]).default("fr"),
});

export type ClientEnv = z.infer<typeof envSchema>;

let cached: ClientEnv | null = null;

export function getEnv(): ClientEnv {
  if (cached) return cached;

  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env['NEXT_PUBLIC_API_URL'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_MOSIP_CLIENT_ID: process.env['NEXT_PUBLIC_MOSIP_CLIENT_ID'],
    NEXT_PUBLIC_MOSIP_ISSUER_URL: process.env['NEXT_PUBLIC_MOSIP_ISSUER_URL'],
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env['NEXT_PUBLIC_DEFAULT_LOCALE'],
  });

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${result.error.issues
        .map((i) => `  ${i.path.join(".")}: ${i.message}`)
        .join("\n")}`,
    );
  }

  cached = result.data;
  return cached;
}
