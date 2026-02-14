# Contributing to TML

Thank you for your interest in contributing to TML. This guide covers setup, coding standards, and the PR process.

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose
- Git

### Setup

```bash
# Clone and install
git clone https://github.com/your-org/tml.git
cd tml
npm install

# Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# Run migrations and seed
npm run db:migrate:dev --workspace=packages/database
npm run db:seed --workspace=packages/database

# Start dev servers
npm run dev
```

### Verify Your Setup

```bash
npm run lint
npm run typecheck
npm test
```

---

## Branch Naming

All branches follow this convention:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation |
| `test/` | Test additions or updates |
| `chore/` | Tooling, dependencies, config |

Examples:
```
feat/attestation-geofence-validation
fix/certificate-signature-verification
docs/api-endpoint-reference
```

---

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

**Scopes**: `api`, `web`, `types`, `crypto`, `database`, `ci`, `docker`

Examples:
```
feat(api): add attestation submission endpoint
fix(crypto): correct Ed25519 signature verification
test(web): add milestone dashboard tests
chore(ci): add Playwright to CI workflow
```

---

## Code Style

### TypeScript

- **Strict mode** is enforced (`strict: true`)
- **No `any`** — use `unknown` with type guards or define proper types
- Explicit return types on all exported functions
- Prefer `interface` for object shapes, `type` for unions/intersections

### Validation

- **Zod schemas** at every system boundary (API requests, env vars, external API responses)
- Schemas live in `packages/types` and are shared across workspaces

### Error Handling

- Extend the base `AppError` class with typed error codes
- Services return `Result<T, E>` — no thrown exceptions in business logic
- Never swallow errors silently

### Internationalization

- All user-facing strings must be externalized via `next-intl`
- Support three locales: FR (French), AR (Arabic), AMZ (Amazigh)
- Test RTL layout for Arabic

### Imports

- Use path aliases: `@tml/types`, `@tml/crypto`, `@tml/database`
- Group order: Node builtins → external deps → internal packages → relative

---

## Branding Rules

The product name is **TML**. Source code, comments, HTML, metadata, and user-facing content must **never** reference:

- Third-party tool branding
- Personal developer names

CI will fail if branding violations are detected.

---

## Pull Request Process

1. Create a branch from `develop` using the naming convention above
2. Make your changes with conventional commits
3. Ensure all checks pass locally:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. Push your branch and open a PR against `develop`
5. Fill out the PR template completely
6. Request at least one review

### PR Checklist

- [ ] Conventional commit format
- [ ] TypeScript strict — no `any` types
- [ ] Zod validation on new boundaries
- [ ] No AI/branding references in code
- [ ] i18n: user-facing strings externalized
- [ ] Responsive: tested at 360px and 1440px
- [ ] All tests pass
- [ ] Lint and typecheck pass

---

## Testing

| Type | Tool | Location |
|------|------|----------|
| Unit (backend) | Vitest | Co-located `*.test.ts` |
| Unit (frontend) | React Testing Library | Co-located `*.test.tsx` |
| Integration | Vitest | `apps/*/tests/` |
| E2E | Playwright | `tests/e2e/` |

**Minimum 80% code coverage** is enforced in CI.

```bash
npm test                          # All unit tests
npm run test:coverage             # With coverage
npm run test:e2e                  # Playwright E2E
npm run test:watch --workspace=X  # Watch mode
```

---

## Architecture

```
Route → Controller → Service → Repository
```

- **Routes** are thin — schema + handler reference only
- **Controllers** parse requests, call services, format responses
- **Services** contain business logic, return `Result<T, E>`
- **Repositories** abstract Prisma calls behind interfaces

Services must be framework-agnostic (no Fastify types). Controllers never contain business logic.

---

## Questions?

Open an issue with the `question` label and we will respond promptly.
