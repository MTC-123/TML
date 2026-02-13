import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().int().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // MOSIP e-Signet OIDC
  MOSIP_ISSUER_URL: z.string().url(),
  MOSIP_CLIENT_ID: z.string().min(1),
  MOSIP_CLIENT_SECRET: z.string().min(1),
  MOSIP_REDIRECT_URI: z.string().url(),

  // System signing key (Ed25519 private key hex)
  SYSTEM_SIGNING_KEY_HEX: z.string().regex(/^[a-f0-9]{64}$/),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

  // Africa's Talking USSD
  AFRICASTALKING_API_KEY: z.string().optional(),
  AFRICASTALKING_USERNAME: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function loadEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    const message = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, val]) => {
        const errors = (val as { _errors?: string[] })._errors ?? [];
        return `  ${key}: ${errors.join(', ')}`;
      })
      .join('\n');
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  cached = result.data;
  return cached;
}

/** Reset cached env — only for tests. */
export function resetEnvCache(): void {
  cached = null;
}
