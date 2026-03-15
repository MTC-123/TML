// Re-export Prisma client for use across the monorepo.
// The actual Prisma client is generated via `prisma generate`
// and consumed directly from @prisma/client in most cases.
// This module serves as the package entry point.

export { PrismaClient } from "@prisma/client";
export type { Prisma } from "@prisma/client";
