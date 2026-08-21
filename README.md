# Subscription Billing System

![CI](https://github.com/jumaelmartins/subscription-billing-system/actions/workflows/ci.yml/badge.svg)

Sistema fullstack de gerenciamento de assinaturas SaaS, desenvolvido como case técnico de portfólio. Demonstra **arquitetura modular**, **processamento assíncrono com RabbitMQ**, **webhooks idempotentes**, **PostgreSQL**, testes automatizados, observabilidade, CI/CD e deploy real.

> Não é um gateway de pagamento. Um **provedor de pagamento fake** simula o ciclo de vida de cobrança para que o foco fique em arquitetura, domínio e confiabilidade. Veja [ADR 0005](docs/adr/0005-fake-payment-provider.md).

## Arquitetura

Monólito modular + workers assíncronos. A **API** cuida de autenticação, regras síncronas e publicação de eventos; os **workers** consomem eventos e fazem o trabalho lento (notificações fake, processamento de webhooks).

```txt
┌───────────┐   HTTP    ┌──────────────┐  publish   ┌────────────┐  consume   ┌─────────────┐
│    Web    │ ────────▶ │     API      │ ─────────▶ │  RabbitMQ  │ ─────────▶ │   Worker    │
│  Next.js  │  /api/*   │   Fastify    │  events    │  topic ex. │  queues    │  consumers  │
└───────────┘  (proxy)  └──────┬───────┘            └─────┬──────┘  + DLQ      └──────┬──────┘
                               │                          │                          │
                               ▼                          │                          ▼
                        ┌────────────┐                    │                   ┌────────────┐
                        │ PostgreSQL │◀───────────────────┴───────────────────│ PostgreSQL │
                        │  (Drizzle) │      transações + constraints           │  (Drizzle) │
                        └────────────┘                                         └────────────┘
```

Exchange topic `billing.events`; filas `billing.{webhooks,notifications,audit,analytics}.queue` + `billing.dead-letter.queue`. Todo evento carrega um `correlationId` que atravessa API e workers.

### Idempotência de webhooks (peça central)

Provedores reenviam webhooks. O sistema protege consistência financeira em **duas camadas** — RabbitMQ (entrega ao-menos-uma-vez) **não** substitui isso:

1. **Ingestão** — todo webhook é persistido em `webhook_events` com `UNIQUE(provider, provider_event_id)`. Uma entrega duplicada não insere nada e é reconhecida sem republicar.
2. **Processamento** — o worker checa o status do evento e faz **updates condicionais** de invoice dentro de uma transação. Um evento reentregue nunca cobra a fatura duas vezes.

Fluxo: `simular pagamento` gera um evento fake e o entrega ao **endpoint real de webhook**, exercitando o caminho idempotente de verdade.

## Stack

| Camada | Tecnologias |
|---|---|
| **API** | Node 22 · Fastify · TypeScript · Drizzle ORM · PostgreSQL · Zod · `@fastify/jwt` (cookie httpOnly) · `@node-rs/argon2` · Pino · OpenAPI/Swagger · `prom-client` |
| **Worker** | Node 22 · `amqp-connection-manager` · Drizzle · Pino · `prom-client` |
| **Web** | Next.js (App Router) · TypeScript · Tailwind · TanStack Query · React Hook Form · Zod |
| **Mensageria** | RabbitMQ (topic exchange, filas, DLQ) |
| **Infra** | Docker · Docker Compose · Caddy (TLS automático) · GitHub Actions · GHCR |
| **Testes** | Vitest · Testcontainers (Postgres + RabbitMQ efêmeros) |

## Monorepo

pnpm workspaces + Turborepo.

```txt
apps/
  api/       Fastify — modules/{auth,users,customers,plans,subscriptions,invoices,payments,webhooks,stats,audit,health}
  worker/    consumers RabbitMQ (notifications, webhooks) + /metrics
  web/       console administrativo Next.js
packages/
  db/        schema Drizzle + client + migrator + migrations (compartilhado api/worker)
  contracts/ eventos, routing keys, filas, DTOs Zod
  config/    tsconfig base
```

## Como rodar

**Requisitos:** Node 22+, pnpm 10+ (`corepack enable`), Docker.

### Stack completa (um comando)

```bash
cp .env.example .env
docker compose up --build
# migrações + admin (uma vez):
docker compose run --rm --entrypoint "sh -c" api "node dist/migrate.js && node dist/seed.js"
```

- Web: http://localhost:3000 · API: http://localhost:3333 · RabbitMQ UI: http://localhost:15672
- Login: `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `.env`.
- Portas do host configuráveis: `POSTGRES_HOST_PORT`, `API_HOST_PORT`, `WEB_HOST_PORT`, etc.

### Desenvolvimento (hot reload)

```bash
pnpm install
docker compose up -d postgres rabbitmq
pnpm --filter @sbs/db db:generate   # se alterou schema
pnpm --filter @sbs/api db:migrate && pnpm --filter @sbs/api db:seed
pnpm dev
```

### Scripts (raiz)

```bash
pnpm build      # turbo build
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint
pnpm test       # vitest (Testcontainers) — serial p/ limitar containers
```

## API (principais rotas)

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` · `/auth/logout` · GET `/auth/me` | Autenticação (JWT em cookie httpOnly) |
| CRUD | `/customers` · `/plans` | Clientes e planos (+ features) |
| POST | `/subscriptions` (+ `/:id/change-plan`,`/cancel`,`/reactivate`) | Ciclo de vida da assinatura |
| POST | `/invoices` (+ `/:id/simulate-payment`,`/simulate-failure`) | Faturas e simulação de pagamento |
| POST | `/webhooks/fake-payment-provider` | Ingestão idempotente de webhook (público) |
| GET | `/webhooks` · `/audit` · `/stats/summary` | Listagens e métricas do dashboard |
| GET | `/health` · `/metrics` · `/docs` | Health (pg+rabbit), Prometheus, Swagger UI |

## Observabilidade

- **Logs** estruturados (Pino/JSON) com `requestId` e `correlationId`.
- **`GET /health`** valida API + PostgreSQL + RabbitMQ.
- **`GET /metrics`** (API) e **`:9100/metrics`** (worker) em formato Prometheus — requests, duração, webhooks recebidos/duplicados, mensagens processadas/DLQ por consumer.
- **`GET /docs`** — OpenAPI/Swagger.

## CI/CD & Deploy

- **CI** (`.github/workflows/ci.yml`): a cada PR/push na `main` roda `lint → typecheck → test → build`.
- **Deploy** (`.github/workflows/deploy.yml`): push na `main` → builda e publica imagens `sbs-api`/`sbs-worker`/`sbs-web` no **GHCR** → SSH no VPS → roda migrations → `docker compose -f docker-compose.prod.yml up -d`. **Caddy** provê HTTPS automático em `app.<DOMAIN>` e `api.<DOMAIN>`.

**Habilitar o deploy (uma vez):** secrets `VPS_HOST`/`VPS_USER`/`VPS_SSH_KEY`, variável `DEPLOY_ENABLED=true`, `~/sbs/.env` no VPS e DNS apontando `app`/`api` para o servidor.

## Documentação

[MVP](docs/mvp-spec.md) · [Arquitetura](docs/architecture.md) · [Domínio](docs/domain-model.md) · [Requisitos](docs/requirements.md) · [Fluxos](docs/user-flows.md) · [Webhooks/Idempotência](docs/webhook-idempotency.md) · [Observabilidade](docs/observability.md) · [CI/CD](docs/ci-cd.md) · [Roadmap](docs/roadmap.md) · [Backlog](docs/backlog.md) · [ADRs](docs/adr)
