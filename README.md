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
                         │        TML API       │
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
| Credentials | W3C Verifiable Credentials (vc-js) |
| DID Method | `did:key` (Ed25519) |
| Presentation | OpenID for Verifiable Presentations (OpenID4VP) |
| Signatures | Ed25519 |
| Integrity | SHA-256 |
| USSD | Africa's Talking API |
| i18n | next-intl (FR / AR / AMZ) |
| Testing | Vitest + React Testing Library + Playwright |
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

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start development servers (API + Web)
npm run dev
```

The API runs on `http://localhost:3001` and the web app on `http://localhost:3000`.

---

## Project Structure

```
TML/
├── apps/
│   ├── api/                        # Fastify backend API
│   │   └── src/
│   │       ├── controllers/        # Request/response handling
│   │       ├── routes/             # HTTP route definitions
│   │       ├── services/           # Business logic
│   │       ├── repositories/       # Prisma database access
│   │       ├── middleware/         # Auth, consent, data-minimization guards
│   │       └── modules/
│   │           └── ussd/           # Africa's Talking USSD integration
│   └── web/                        # Next.js 15 frontend
│       └── src/
│           ├── app/[locale]/
│           │   ├── (auth)/         # Login, OIDC callback
│           │   ├── (citizen)/      # Citizen attestation portal
│           │   ├── (dashboard)/    # Inspector / Auditor / Admin dashboard
│           │   └── (public)/       # Landing page, about, public verify
│           ├── components/         # Shared UI components
│           ├── i18n/               # FR / AR / AMZ translations
│           └── lib/                # API client, hooks, utilities
├── packages/
│   ├── types/                      # Shared TypeScript types + Zod schemas
│   ├── crypto/                     # Cryptographic primitives
│   │   ├── did.ts                  # DID generation and resolution
│   │   ├── keys.ts                 # Ed25519 key pair management
│   │   ├── signing.ts              # Digital signature operations
│   │   ├── hashing.ts              # SHA-256 integrity hashing
│   │   ├── certificate.ts          # Payment Clearance Certificate engine
│   │   ├── credentials.ts          # W3C Verifiable Credential operations
│   │   ├── presentation.ts         # OpenID4VP presentation handling
│   │   ├── selective-disclosure.ts # Attribute-level selective disclosure
│   │   ├── qr-payload.ts           # QR code payload encoding / decoding
│   │   └── zkp.ts                  # Zero-knowledge proof utilities
│   └── database/                   # Prisma schema, migrations, seed data
├── scripts/                        # Development utilities
├── tests/
│   └── e2e/                        # Playwright end-to-end tests
└── docker/
    └── docker-compose.yml
```

---

## API Reference

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/login` | Initiate MOSIP e-Signet OIDC flow |
| `GET` | `/auth/callback` | OIDC callback — issues JWT |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Invalidate session |

### Projects & Milestones

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects` | List infrastructure projects |
| `POST` | `/projects` | Create project |
| `GET` | `/projects/:id` | Get project details |
| `PATCH` | `/projects/:id` | Update project |
| `GET` | `/projects/:id/milestones` | List project milestones |
| `POST` | `/milestones` | Create milestone |
| `PATCH` | `/milestones/:id` | Update milestone |

### Attestations

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/milestones/:id/attestations` | Submit attestation (inspector / auditor / citizen) |
| `GET` | `/milestones/:id/attestations` | List attestations for milestone |
| `GET` | `/milestones/:id/quorum` | Get quorum status breakdown |
| `POST` | `/attestations/:id/revoke` | Revoke attestation |

### Certificates

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/certificates/generate` | Generate Payment Clearance Certificate |
| `GET` | `/certificates/:id` | Get certificate details |
| `GET` | `/certificates/:id/pdf` | Download certificate as PDF |
| `POST` | `/certificates/:id/deliver` | Deliver certificate to TGR |
| `POST` | `/certificates/:id/revoke` | Revoke certificate |

### Verification

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/verify/hash` | Verify certificate integrity by hash |
| `POST` | `/verify/qr` | Verify certificate via QR payload |
| `GET` | `/verify/oidc/request` | Generate OpenID4VP authorization request |
| `POST` | `/verify/oidc/response` | Process OpenID4VP authorization response |

### Verifiable Credentials

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/credentials/issue` | Issue a W3C Verifiable Credential |
| `GET` | `/credentials` | List credentials for authenticated actor |
| `GET` | `/credentials/:id` | Get credential details |
| `POST` | `/credentials/:id/revoke` | Revoke credential |

### Trusted Issuers

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/trusted-issuers` | Register trusted issuer |
| `GET` | `/trusted-issuers` | List active trusted issuers |
| `DELETE` | `/trusted-issuers/:did` | Revoke trusted issuer |
| `GET` | `/.well-known/openid-configuration` | OIDC discovery document |

### Consent

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/consent/grant` | Record explicit consent |
| `GET` | `/consent` | List consent records for actor |
| `POST` | `/consent/:id/revoke` | Revoke consent record |

### DID Agent

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/agent/invitations` | Create DID connection invitation |
| `POST` | `/agent/connections/:id/accept` | Accept connection invitation |
| `GET` | `/agent/connections` | List agent connections |
| `POST` | `/agent/proof-requests` | Send proof request to peer |

### Auditor Assignments & Disputes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/milestones/:id/assignments` | Assign auditor to milestone |
| `PATCH` | `/assignments/:id` | Update assignment status |
| `POST` | `/disputes` | Open dispute |
| `PATCH` | `/disputes/:id/resolve` | Resolve dispute |

### Citizen Pools

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/milestones/:id/citizen-pools` | Enroll citizen in attestation pool |
| `PATCH` | `/citizen-pools/:id` | Update enrollment status |

### Audit Logs & Webhooks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/audit-logs` | Query immutable audit trail |
| `POST` | `/webhooks` | Subscribe to system events |
| `GET` | `/webhooks` | List subscriptions |
| `DELETE` | `/webhooks/:id` | Remove subscription |

---

## Architecture

All API requests flow through four layers:

```
Route → Controller → Service → Repository
```

| Layer | Responsibility |
|-------|---------------|
| **Route** | HTTP method, path, Zod schema attachment, auth guards |
| **Controller** | Parse/validate request, call service, format HTTP response |
| **Service** | Business logic, domain rules, returns `Result<T, E>` |
| **Repository** | Database queries via Prisma, data mapping |

### Middleware

| Middleware | Purpose |
|-----------|---------|
| `authenticate` | JWT validation — blocks unauthenticated requests |
| `requireRoles` | RBAC enforcement at route level |
| `consent-guard` | Ensures valid consent exists before data access |
| `data-minimization` | Strips response fields not covered by active consent |

### Certificate Generation Flow

```
Quorum verified
      │
      ▼
Certificate Engine (packages/crypto)
  ├── Hashes milestone data with SHA-256
  ├── Constructs W3C Verifiable Credential payload
  ├── Signs with system Ed25519 key
  └── Generates PDF + QR code
      │
      ▼
TGR delivery endpoint
```

---

## Cryptographic Primitives (`packages/crypto`)

| Module | Description |
|--------|-------------|
| `did` | `did:key` generation and resolution |
| `keys` | Ed25519 key pair creation and management |
| `signing` | Sign and verify arbitrary payloads |
| `hashing` | SHA-256 deterministic hashing |
| `certificate` | Payment Clearance Certificate construction |
| `credentials` | W3C Verifiable Credential issuance and verification |
| `presentation` | OpenID4VP presentation creation and validation |
| `selective-disclosure` | Per-attribute selective disclosure of credentials |
| `qr-payload` | Compact QR payload encoding and decoding |
| `zkp` | Zero-knowledge proof utilities |

---

## Compliance

TML enforces multi-party attestation for every infrastructure milestone:

- **Inspector attestation** — geofenced on-site verification (GPS boundary check)
- **Auditor attestation** — document review and compliance check
- **Citizen quorum** — configurable weighted threshold of community attestations
- **Assurance tiers** — higher-risk projects require stricter attestation rules (`biometric` > `ussd` > `cso_mediated`)
- **Consent management** — all data access requires explicit, recorded consent (GDPR-aligned)
- **Audit trail** — every state change is logged with actor DID and payload hash

Payment Clearance Certificates are cryptographically signed (Ed25519) and integrity-hashed (SHA-256), providing tamper-evident proof for TGR fund disbursement authorization.

---

## Frontend

The Next.js 15 frontend supports three roles with dedicated portals:

| Portal | Path | Description |
|--------|------|-------------|
| Public | `/` | Landing page, project map, public certificate verification |
| Citizen | `/(citizen)/` | USSD enrollment, attestation submission |
| Dashboard | `/(dashboard)/` | Inspector and auditor attestation workflows, admin controls |

Features include:
- MOSIP e-Signet OIDC login flow
- Real-time attestation status via WebSockets
- Certificate PDF download and QR verification
- Dispute filing and tracking
- Offline-capable citizen portal with USSD fallback

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

## Development

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e

# Lint all workspaces
npm run lint

# Type-check all workspaces
npm run typecheck

# Build all packages and apps
npm run build

# Open Prisma Studio
npm run db:studio --workspace=packages/database
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding standards, and PR guidelines.

---

## License

All rights reserved.
