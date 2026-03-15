import type { ActorRole } from "@tml/types";

export const API_BASE_PATH = "/api/v1";

export const ROLES = {
  contractor_engineer: "contractor_engineer",
  independent_auditor: "independent_auditor",
  citizen: "citizen",
  admin: "admin",
  cso_aggregator: "cso_aggregator",
} as const satisfies Record<string, ActorRole>;

export const ROLE_LABELS: Record<ActorRole, string> = {
  contractor_engineer: "Contractor / Engineer",
  independent_auditor: "Independent Auditor",
  citizen: "Citizen",
  admin: "Administrator",
  cso_aggregator: "CSO Aggregator",
};

export const SUPPORTED_LOCALES = ["en", "fr", "ar", "tzm"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "fr";

export const RTL_LOCALES: SupportedLocale[] = ["ar"];

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
} as const;

export const AUTH_STORAGE_KEY = "tml-auth";

export const TOKEN_REFRESH_BUFFER_MS = 60_000; // refresh 1 min before expiry
