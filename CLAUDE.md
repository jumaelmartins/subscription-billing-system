# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current State

**Phase 0 (walking skeleton) is implemented.** The monorepo is scaffolded (pnpm workspaces + Turborepo) with a minimal but running `api`, `worker`, and `web`, shared `contracts`/`config` packages, Docker images, dev + prod compose, Caddy reverse proxy, and CI/CD workflows. Domain features (auth, customers, plans, subscriptions, billing, RabbitMQ workers, webhooks, admin UI) are **not built yet** — follow `docs/roadmap.md` phase order and `docs/backlog.md` epics. The build/deploy scaffolding is proven end-to-end locally (`docker compose up` → api `/health` returns `ok`).

`docs/` is written in **Portuguese**. Code, identifiers, and this file are in English.

## Commands (run from repo root)

```bash
pnpm install                 # install workspace
pnpm build                   # turbo build all packages
pnpm typecheck               # tsc --noEmit across packages
pnpm lint                    # eslint (apps/web excluded; linted by Next)
pnpm test                    # vitest
pnpm --filter @sbs/api test  # test a single package
docker compose up --build    # full local stack (pg, rabbit, api, worker, web)
docker compose up -d postgres rabbitmq && pnpm dev   # infra + hot-reload dev
```

Notes: contracts is a **dev dependency** of api/worker and is bundled into their `dist` by tsup (`noExternal`), so the prod images don't link it. `pnpm build` must run before `typecheck`/`test`/Docker (turbo handles ordering via `^build`). Next.js `output: 'standalone'` is gated behind `BUILD_STANDALONE=1` (set only in the web Dockerfile) so local Windows builds aren't blocked by symlink privileges. Host ports in dev compose are overridable (`POSTGRES_HOST_PORT`, `API_HOST_PORT`, …).

## What This Is

Portfolio case study of a SaaS **subscription billing system**. Explicit non-goal: it does not integrate a real payment gateway (Stripe/Mercado Pago/Pagar.me) and never charges a real card — payments and their webhooks are simulated by a **fake payment provider** (see `docs/adr/0005-fake-payment-provider.md`). The point is to demonstrate architecture, domain modeling, async processing, idempotency, observability, tests, CI/CD, and a real deploy — not to be a payment processor.

## Architecture (read these together)

The design lives across `docs/architecture.md`, `docs/domain-model.md`, `docs/webhook-idempotency.md`, `docs/observability.md`, and the ADRs. The big picture:

**Modular monolith + async workers**, not microservices (ADR 0001). One `apps/api` process owns auth, synchronous rules, HTTP endpoints, and event *publishing*. Separate `apps/worker` process(es) *consume* events and do the slow work (webhook processing, invoice generation, fake notifications, audit logging). The API must not run long tasks inside the HTTP request.

Planned monorepo layout: `apps/api` (Fastify), `apps/web` (Next.js admin UI), `apps/worker`, plus `packages/contracts` and `packages/config`. Inside `apps/api/src/`, code is split into `modules/` (auth, users, customers, plans, subscriptions, invoices, payments, webhooks, billing, notifications, audit) over a `shared/` layer (database, logger, config, errors, http, messaging, observability). Modules must keep clear boundaries and talk via services or events, not each other's internals.

### Messaging (RabbitMQ, ADR 0002)

One **topic exchange `billing.events`**. Producers (the API) publish with routing keys; consumers (workers) bind queues to key patterns. Named routing keys and queues are fixed in `docs/architecture.md` — reuse those exact strings (e.g. `subscription.created`, `invoice.paid`, `payment.webhook.received`; queues `billing.webhooks.queue`, `billing.invoices.queue`, `billing.notifications.queue`, `billing.audit.queue`, `billing.dead-letter.queue`). Failed messages route to the **DLQ**.

### The two load-bearing invariants

These are the whole point of the case study — get them right:

1. **Webhook idempotency (ADR 0004, `docs/webhook-idempotency.md`).** Every webhook is persisted to `webhook_events` *before* processing. `(provider, provider_event_id)` is **UNIQUE**. A duplicate returns success but must **not** re-run business logic. **RabbitMQ does not provide idempotency** — assume at-least-once delivery and partial consumer failures. Critical consistency lives in the DB: unique constraints, transactions, current-status checks, conditional updates. Never rely on the queue to prevent double-processing.

2. **Correlated event chains (`docs/observability.md`).** A single flow (e.g. webhook received → `payment.webhook.received` → `invoice.paid` → `subscription.activated` → `notification.email.requested`) must carry one shared `correlationId` across the API and every worker log/event. Every HTTP request also gets a `requestId` that propagates into published events.

The canonical end-to-end flows (create subscription, generate invoice, simulate payment/failure, cancel, duplicate webhook) are written step-by-step in `docs/user-flows.md` — consult it before implementing any billing path so the event order and status transitions match.

### Domain state machines

`docs/domain-model.md` fixes the entities, their status enums, and the relational shape. Enforce the documented status values and transitions (Subscription: `trialing → active → past_due → canceled`, plus `paused`/`expired`; Invoice: `open/paid/failed/void/refunded`; Payment: `pending/paid/failed/refunded`; WebhookEvent: `received/processing/processed/failed/ignored`). Status transitions and money-affecting updates must run inside transactions.

## Toolchain (reference)

Stack in use / planned per phase (from `README.md` and `docs/requirements.md`):

- **API**: Node + Fastify + TypeScript, Drizzle ORM over PostgreSQL, Zod for all external-input validation, Pino structured (JSON) logging, OpenAPI/Swagger docs, JWT auth with hashed passwords.
- **Web**: Next.js + TypeScript, Tailwind, shadcn/ui, TanStack Query, React Hook Form, Zod.
- **Tests**: **Vitest** (unit + integration). Prioritize idempotency/duplicate-webhook tests and subscription status-transition tests.
- **Env**: validate all environment variables at startup (Zod) — fail fast on missing/invalid config.
- **Infra**: Docker Compose must bring up api, web, worker, PostgreSQL, and RabbitMQ together (`docs/adr/0003-postgresql.md`, ADR 0002).
- **CI** (`docs/ci-cd.md`): GitHub Actions running, in order — `install → lint → typecheck → test → build`. Keep any scripts you add consistent with these stage names so CI stays trivial.

Native deps (e.g. `argon2`) are deliberately deferred to their phase to keep `pnpm install` on Windows friction-free; add them in the phase that needs them.

## Required Endpoints

`GET /health` must check API + PostgreSQL + RabbitMQ connectivity. `GET /metrics` exposes request counts/durations and webhook/worker/DLQ counters (`docs/observability.md`). Webhook intake endpoint: `/webhooks/fake-payment-provider` (`docs/backlog.md` EPIC 08).
