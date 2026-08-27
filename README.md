# crazp-app

pnpm + Turborepo monorepo. Node `>=20`, package manager `pnpm@10.33.4`.

## Structure

```
apps/
  web/         Marketing site (Next.js, :3000)
  dashboard/   App + auth (Next.js → Cloudflare via OpenNext, app.localhost:3001)
  worker/      Build/deploy worker (Wrangler, D1, R2, Queues, Containers/Sandbox)
  dispatch/    Workers for Platforms dispatcher (:8788)
packages/
  ui/          Shared shadcn/ui + Tailwind
  db/          Drizzle schema + D1 migrations
  auth/        better-auth config
  typescript-config/
  oxlint-config/
scripts/
  vendor-crazp-core.mjs
```

## Prerequisites

- Node 20+
- pnpm 10+
- Cloudflare account + [Wrangler](https://developers.cloudflare.com/workers/wrangler/) auth (`wrangler login`)
- Docker (required for worker sandbox / container builds)

## Setup

```bash
pnpm install

# Env files (gitignored; loaded by Next / wrangler)
cp apps/dashboard/.dev.vars.example apps/dashboard/.dev.vars
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
cp apps/web/.dev.vars.example apps/web/.dev.vars
# apps/dispatch/.dev.vars.example is optional (no secrets required)

# Apply D1 migrations locally (uses dashboard wrangler state)
pnpm db:migrate:local
```

Fill `apps/worker/.dev.vars` with Cloudflare account id, API token, and R2 credentials before running the worker. See comments in that example file.

## Develop

```bash
# web + dashboard only (worker/dispatch excluded by default)
pnpm dev

# Cloudflare workers separately (share D1 state with dashboard)
pnpm --filter worker dev
pnpm --filter dispatch dev
```

| App       | URL / notes                                      |
| --------- | ------------------------------------------------ |
| web       | http://localhost:3000                            |
| dashboard | http://app.localhost:3001                        |
| worker    | Wrangler; persists to `apps/dashboard/.wrangler` |
| dispatch  | http://{script}.localhost:8788                   |

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm format          # oxfmt
```

## Database

Drizzle + Cloudflare D1. Schema and migrations live in `packages/db`.

```bash
pnpm db:generate          # drizzle-kit generate → packages/db/migrations
pnpm db:migrate:local     # wrangler d1 migrations apply (local)
pnpm db:studio            # drizzle-kit studio (needs local D1 sqlite after migrate)
pnpm auth:generate        # regenerate auth tables into packages/db
```

Remote studio/generate uses `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_TOKEN`, and optional `CLOUDFLARE_DATABASE_ID` / `LOCAL_DB_PATH` (see `packages/db/drizzle.config.ts`).

Dashboard and worker both bind `DATABASE` → `crazp-db` with `migrations_dir` pointing at `packages/db/migrations`.

## Auth

`@workspace/auth` (better-auth + D1 + KV). Dashboard secrets/vars:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `EMAIL_FROM` (+ Cloudflare Email binding in production)

## Worker & sandbox

The worker builds and deploys user agents inside a Cloudflare Sandbox container (Docker-in-Docker; see `apps/worker/Dockerfile` + `boot-docker.sh`).

Bindings (see `apps/worker/wrangler.jsonc`): D1, R2 (`AGENT_DEPLOYMENT_BUCKET`), queue consumer `crazp-agent-deployments`, Durable Object `Sandbox`.

### Vendoring `@crazp/core`

Runtime installs a packed tarball into the sandbox. Pin the version in `apps/worker/crazp-core.version`, then:

```bash
pnpm vendor:crazp
```

Resolution order (local):

1. `CRAZP_CORE_DIR` if set
2. Sibling `../crazp/packages/core` when its `package.json` version matches the pin
3. Otherwise clone `crazp-core` at the tagged release

Useful env flags: `CRAZP_VENDOR_FORCE=1`, `CRAZP_VENDOR_FORCE_CLONE=1`, `CRAZP_CORE_TOKEN` (private clone / CI).

CI: `.github/workflows/vendor-crazp-core.yml` re-vendors when the version pin or vendor script changes.

## Dispatch

Workers for Platforms entrypoint (`apps/dispatch`). Bind a wildcard hostname to the worker in production; locally use `{workerName}.localhost:8788`. Namespace is configured in `wrangler.jsonc` (`crazp-agents-dev`).

## UI components

```bash
pnpm dlx shadcn@latest add button -c apps/web
# or -c apps/dashboard
```

Components land in `packages/ui`. Import from `@workspace/ui/components/...`.

## Deploy

```bash
pnpm --filter dashboard deploy   # OpenNext → Cloudflare
pnpm --filter worker deploy
pnpm --filter dispatch deploy
```

Ensure production secrets (`BETTER_AUTH_SECRET`, `CLOUDFLARE_API_TOKEN`, R2 keys, etc.) are set via `wrangler secret put` before deploying workers.
