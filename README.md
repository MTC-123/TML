# TML — Transparent Milestone Ledger

> Digital identity attestation middleware for public infrastructure accountability in Morocco and Africa.

TML connects contractors, inspectors, auditors, and citizens through CNIE-verified digital identities. It generates cryptographic **Payment Clearance Certificates** as mandatory pre-conditions for government fund disbursement via the **Trésorerie Générale du Royaume (TGR)**.

---

## How It Works

```
                         ┌─────────────────────────────┐
                         │     Public Infrastructure    │
                         │         Project Site         │
                         └──────────┬──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
              │ Inspector  │  │  Auditor   │  │ Citizens  │
              │ (on-site)  │  │ (docs)     │  │ (quorum)  │
              └─────┬──────┘  └─────┬──────┘  └─────┬─────┘
                    │               │               │
                    │  Attestations (Ed25519 signed) │
                    └───────────────┼───────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │        TML API      │
                         │  Quorum Validation   │
                         │  Certificate Engine  │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  Payment Clearance   │
                         │    Certificate       │
                         │  (SHA-256 + Ed25519) │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │    TGR Integration   │
                         │  Fund Disbursement   │
                         └─────────────────────┘
```

1. **Project milestone** marked complete by contractor
2. **Inspector** attests on-site completion (geofenced GPS verification)
3. **Auditor** reviews documentation and attests compliance
4. **Citizen quorum** attests satisfaction (configurable threshold)
5. **TML** verifies quorum → generates Payment Clearance Certificate
6. **Certificate** signed with Ed25519, hashed with SHA-256, delivered to TGR

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 LTS |
| Language | TypeScript 5.5 (strict) |
| Backend | Fastify 5 |
| Frontend | Next.js 15 (App Router) |
| Database | PostgreSQL 16 + Prisma 6 |
| Cache | Redis 7 |
| UI | Tailwind CSS 4 + shadcn/ui |
| Identity | MOSIP e-Signet (OIDC) + CNIE |
| Credentials | W3C Verifiable Credentials |
| DID Method | `did:key` (Ed25519) |
| Signatures | Ed25519 |
| Integrity | SHA-256 |
| USSD | Africa's Talking API |
| i18n | next-intl (FR / AR / AMZ) |
| Monorepo | npm workspaces |

---

## Quick Start

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/tml.git
cd tml

# Install dependencies
npm install

# Start infrastructure (PostgreSQL + Redis)
docker compose -f docker/docker-compose.yml up -d

# Run database migrations
npm run db:migrate:dev --workspace=packages/database

# Seed the database
npm run db:seed --workspace=packages/database

# Start development servers (API + Web)
npm run dev
```

The API runs on `http://localhost:3001` and the web app on `http://localhost:3000`.

---

## Project Structure

```
TML/
├── apps/
│   ├── api/          # Fastify backend API
│   └── web/          # Next.js frontend
├── packages/
│   ├── types/        # Shared TypeScript types + Zod schemas
│   ├── crypto/       # DID, VC, Ed25519 signing utilities
│   └── database/     # Prisma schema, migrations, seed
├── tests/
│   └── e2e/          # Playwright E2E tests
└── docker/
    └── docker-compose.yml
```

---

## Development

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Lint
npm run lint

# Type-check
npm run typecheck

# Build all
npm run build
```

---

## Architecture

All API requests flow through four layers:

```
Route → Controller → Service → Repository
```

- **Route** — HTTP method, path, schema, auth guards
- **Controller** — Parse request, call service, format response
- **Service** — Business logic, domain rules, returns `Result<T, E>`
- **Repository** — Database queries via Prisma

---

## Compliance

TML enforces multi-party attestation for every infrastructure milestone:

- **Inspector attestation** — geofenced on-site verification
- **Auditor attestation** — document review and compliance check
- **Citizen quorum** — configurable threshold of community attestations
- **Assurance tiers** — higher-risk projects require stricter attestation rules

Payment Clearance Certificates are cryptographically signed (Ed25519) and integrity-hashed (SHA-256), providing tamper-evident proof for TGR fund disbursement authorization.

---

## Internationalization

TML supports three languages:

| Code | Language |
|------|----------|
| `fr` | French (default) |
| `ar` | Arabic (RTL) |
| `amz` | Amazigh |

All user-facing strings are externalized via `next-intl`.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding standards, and PR guidelines.

---

## License

All rights reserved.
