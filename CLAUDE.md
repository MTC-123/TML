# TML — Transparency Middleware Layer

## Project Overview

TML is a digital identity attestation middleware for public infrastructure accountability in Morocco and Africa. It connects contractors, inspectors, auditors, and citizens through CNIE-verified digital identities and generates cryptographic **Payment Clearance Certificates** as mandatory pre-conditions for government fund disbursement via the **Trésorerie Générale du Royaume (TGR)**.

### Core Purpose

Public infrastructure projects (roads, schools, hospitals) require verified milestone completion before funds are released. TML enforces this by:

1. Binding real identities (CNIE / national ID) to decentralized identifiers (DIDs)
2. Requiring multi-party attestations (inspector + auditor + citizen quorum) per milestone
3. Generating tamper-evident Payment Clearance Certificates with Ed25519 signatures
4. Integrating with TGR systems for fund disbursement authorization

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 22.x LTS |
| Language | TypeScript | 5.5 |
| Backend Framework | Fastify | 5.x |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 16.x |
| Frontend Framework | Next.js (App Router) | 15.x |
| CSS | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | latest |
| Auth/Identity | MOSIP e-Signet (OIDC) | — |
| Verifiable Credentials | vc-js (W3C spec) | latest |
| DID Method | did:key | — |
| Signatures | Ed25519 | — |
| Integrity Hashes | SHA-256 | — |
| USSD Gateway | Africa's Talking API | — |
| Real-time | WebSockets | — |
| Caching/Sessions | Redis | 7.x |
| Containers | Docker Compose | 3.x |
| CI/CD | GitHub Actions | — |
| Backend Testing | Vitest | latest |
| E2E Testing | Playwright | latest |
| Frontend Testing | React Testing Library | latest |
| Monorepo | npm workspaces | — |

---

## Frontend Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Server State**: React Query v5 (TanStack Query)
- **UI State**: Zustand
- **Internationalization**: next-intl (supports FR/AR/AMZ)
- **Maps**: Mapbox GL JS
- **Charts**: Recharts
- **Forms**: react-hook-form + Zod validation
- **Icons**: Lucide React
- **Typography**: Inter font family

### Design System

| Element | Value |
|---------|-------|
| Primary | Navy `#1e3a5f` |
| Accent | Green `#2d8a4e` |
| Warning | Amber `#d97706` |
| Danger | Red `#dc2626` |
| Typography | Inter (Google Fonts) |
| Style | No gradients — flat, solid colors only |

---

## Branding Rules

The product name is **TML**. Never reference Claude, Anthropic, AI assistants, or any AI tooling in source code, comments, HTML meta tags, footers, about pages, package descriptions, or any user-facing content.

---

## Monorepo Structure

```
TML/
├── apps/
│   ├── api/                    # Fastify backend API
│   │   ├── src/
│   │   │   ├── routes/         # Fastify route definitions
│   │   │   ├── controllers/    # Request/response handling
│   │   │   ├── services/       # Business logic
│   │   │   ├── repositories/   # Database access (Prisma)
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   ├── plugins/       # Fastify plugins
│   │   │   └── config/        # Environment and app config
│   │   ├── tests/
│   │   └── package.json
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # App Router pages and layouts
│       │   ├── components/     # React components
│       │   ├── lib/            # Client utilities
│       │   └── hooks/          # Custom React hooks
│       ├── tests/
│       └── package.json
├── packages/
│   ├── types/                  # Shared TypeScript types and Zod schemas
│   │   ├── src/
│   │   └── package.json
│   ├── crypto/                 # DID, VC, Ed25519 signing utilities
│   │   ├── src/
│   │   └── package.json
│   └── database/               # Prisma schema, migrations, seed
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       ├── src/
│       └── package.json
├── tests/                      # E2E tests (Playwright)
│   └── e2e/
├── .github/
│   ├── workflows/
│   └── pull_request_template.md
├── docker/
│   └── docker-compose.yml
├── CLAUDE.md
├── package.json                # Root workspace config
└── tsconfig.base.json          # Shared TS config
```

---

## Terminal Commands

### Development

```bash
# Install all dependencies
npm install

# Start all services (api + web + docker deps)
npm run dev

# Start individual apps
npm run dev --workspace=apps/api
npm run dev --workspace=apps/web

# Start infrastructure (PostgreSQL, Redis)
docker compose -f docker/docker-compose.yml up -d
```

### Testing

```bash
# Run all tests
npm test

# Run backend tests (Vitest)
npm test --workspace=apps/api

# Run frontend tests (React Testing Library)
npm test --workspace=apps/web

# Run E2E tests (Playwright)
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch --workspace=apps/api
```

### Build

```bash
# Build all packages and apps
npm run build

# Build individual workspace
npm run build --workspace=apps/api
npm run build --workspace=apps/web
npm run build --workspace=packages/types
npm run build --workspace=packages/crypto
npm run build --workspace=packages/database
```

### Linting & Formatting

```bash
# Lint all workspaces
npm run lint

# Lint with auto-fix
npm run lint:fix

# Type-check all workspaces
npm run typecheck
```

### Database (Prisma)

```bash
# Generate Prisma client
npm run db:generate --workspace=packages/database

# Run migrations (development)
npm run db:migrate:dev --workspace=packages/database

# Run migrations (production)
npm run db:migrate:deploy --workspace=packages/database

# Reset database (development only)
npm run db:reset --workspace=packages/database

# Seed database
npm run db:seed --workspace=packages/database

# Open Prisma Studio
npm run db:studio --workspace=packages/database
```

### Docker

```bash
# Start all services
docker compose -f docker/docker-compose.yml up -d

# Stop all services
docker compose -f docker/docker-compose.yml down

# Rebuild containers
docker compose -f docker/docker-compose.yml up -d --build

# View logs
docker compose -f docker/docker-compose.yml logs -f
```

---

## Code Style

### TypeScript

- **Strict mode** enabled everywhere (`strict: true` in tsconfig)
- **No `any`** — use `unknown` and narrow with type guards, or define proper types
- All public API boundaries validated with **Zod schemas** (request bodies, query params, env vars)
- Explicit return types on all exported functions
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `as const` assertions for literal types

### Error Handling

- All errors are **typed** — extend a base `AppError` class with error codes
- Services return `Result<T, E>` types (no thrown exceptions in business logic)
- Controllers catch and map service errors to HTTP responses
- Use Fastify's `setErrorHandler` for unhandled errors
- Never swallow errors silently — always log with structured context

### Validation

- **Zod schemas** at every system boundary:
  - API request validation (body, params, query, headers)
  - Environment variable parsing at startup
  - External API response validation
  - Database query result validation where needed
- Schemas co-located in `packages/types` and importable across workspaces

### Imports

- Use path aliases (`@tml/types`, `@tml/crypto`, `@tml/database`)
- Group imports: node builtins → external deps → internal packages → relative
- No barrel files (`index.ts` re-exports) unless a package's public API

---

## Architecture

### Service Layer Pattern

All API requests flow through four layers:

```
Route → Controller → Service → Repository
```

| Layer | Responsibility |
|-------|---------------|
| **Route** | HTTP method, path, schema attachment, auth guards |
| **Controller** | Parse/validate request, call service, format HTTP response |
| **Service** | Business logic, orchestration, domain rules, returns `Result<T, E>` |
| **Repository** | Database queries via Prisma, data mapping |

- Routes are thin — schema + handler reference only
- Controllers never contain business logic
- Services are framework-agnostic (no Fastify types)
- Repositories abstract all Prisma calls behind interfaces

### Authentication Flow

1. User authenticates via MOSIP e-Signet (OIDC)
2. CNIE identity verified → DID (`did:key`) generated or retrieved
3. JWT access token issued with DID as subject
4. Fastify `preHandler` hook validates JWT on protected routes
5. Role-based access control (RBAC) enforced at route level

### Payment Clearance Certificate Flow

1. Project milestone marked complete by contractor
2. Inspector attests on-site completion (geofenced)
3. Auditor reviews documentation and attests
4. Citizen quorum (configurable threshold) attests satisfaction
5. System verifies quorum reached → generates certificate
6. Certificate signed with Ed25519, hashed with SHA-256
7. Certificate delivered to TGR integration endpoint

---

## Testing Strategy

### Unit Tests

- Co-located with source files: `foo.ts` → `foo.test.ts`
- Run with **Vitest** (backend) and **React Testing Library** (frontend)
- Mock external dependencies at repository/adapter boundaries
- **80% minimum coverage** enforced in CI

### Integration Tests

- Located in each app's `tests/` directory
- Test service + repository layers against a real test database
- Use Prisma migrations on a test-specific PostgreSQL database

### E2E Tests

- Located in `/tests/e2e/`
- Run with **Playwright**
- Test critical user flows: login, attestation, certificate generation
- Run against Docker Compose stack in CI

### Test Commands Summary

```bash
npm test                           # All unit tests
npm run test:coverage              # With coverage report
npm run test:e2e                   # Playwright E2E
npm run test:watch --workspace=X   # Watch mode for workspace X
```

---

## Domain Glossary

| Term | Definition |
|------|-----------|
| **Attestation** | A cryptographically signed statement by an identified party (inspector, auditor, citizen) confirming a fact about a milestone. |
| **Milestone** | A defined deliverable within a public infrastructure project (e.g., "foundation poured", "roof completed"). |
| **Compliance Certificate** | Synonym for Payment Clearance Certificate — the cryptographic proof that all required attestations are met for fund release. |
| **Payment Clearance Certificate** | The final signed document authorizing TGR to disburse funds for a completed milestone. |
| **Quorum** | The minimum number of attestations from a given role (e.g., 3 of 5 citizens) required to satisfy a compliance rule. |
| **Assurance Tier** | A classification of project risk/importance that determines the strictness of attestation requirements (e.g., Tier 1 requires more attestors). |
| **Geofence** | A GPS-defined boundary around a project site. Certain attestations (e.g., inspector) must originate from within the geofence. |
| **DID (Decentralized Identifier)** | A self-sovereign identifier (`did:key:z6Mk...`) bound to a cryptographic key pair, not controlled by any central authority. |
| **Verifiable Credential (VC)** | A W3C-standard digital credential issued to a DID, asserting claims (e.g., "this person is a licensed inspector"). |
| **CNIE** | Carte Nationale d'Identité Électronique — Morocco's national electronic ID card, used as the root identity anchor. |
| **TGR** | Trésorerie Générale du Royaume — Morocco's public treasury, responsible for government fund disbursement. |
| **MOSIP** | Modular Open Source Identity Platform — provides the e-Signet OIDC layer for identity verification. |
| **USSD** | Unstructured Supplementary Service Data — a protocol for interactive text sessions on basic mobile phones, used for citizen attestation in low-connectivity areas. |

---

## Git Workflow

### Branching Strategy

- `main` — production-ready, protected
- `develop` — integration branch
- `feature/<ticket>-<description>` — new features
- `fix/<ticket>-<description>` — bug fixes
- `chore/<description>` — tooling, deps, config

### Conventional Commits

All commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

Scopes: `api`, `web`, `types`, `crypto`, `database`, `ci`, `docker`

Examples:
```
feat(api): add attestation submission endpoint
fix(crypto): correct Ed25519 signature verification
chore(ci): add Playwright to GitHub Actions workflow
```

### Pull Requests

- All PRs target `develop` (or `main` for releases)
- Require at least 1 review approval
- CI must pass (lint, typecheck, test, build)
- Use the PR template in `.github/pull_request_template.md`
