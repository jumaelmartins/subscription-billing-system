# Subscription Billing System

Sistema fullstack de gerenciamento de assinaturas SaaS desenvolvido como case técnico de portfólio.

O objetivo do projeto é demonstrar arquitetura modular, processamento assíncrono com RabbitMQ, webhooks idempotentes, PostgreSQL, testes automatizados, observabilidade, CI/CD e deploy real.

## Objetivo

Este projeto não tem como objetivo substituir gateways de pagamento como Stripe, Mercado Pago ou Pagar.me. A proposta é construir um MVP funcional que simule o ciclo de vida de assinaturas SaaS e sirva como estudo prático de engenharia de software.

## Stack Prevista

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod

### Backend
- Node.js
- Fastify
- TypeScript
- Drizzle ORM
- PostgreSQL
- Zod
- Pino Logger
- OpenAPI/Swagger

### Mensageria
- RabbitMQ
- Topic Exchange
- Queues
- Routing Keys
- Dead Letter Queue

### Infraestrutura
- Docker
- Docker Compose
- GitHub Actions
- Deploy em VPS ou plataforma cloud

## Documentação

- [MVP Spec](docs/mvp-spec.md)
- [Arquitetura](docs/architecture.md)
- [Modelo de Domínio](docs/domain-model.md)
- [Requisitos](docs/requirements.md)
- [Fluxos de Usuário](docs/user-flows.md)
- [Roadmap](docs/roadmap.md)
- [Backlog Técnico](docs/backlog.md)
- [Observabilidade](docs/observability.md)
- [Webhooks e Idempotência](docs/webhook-idempotency.md)
- [CI/CD](docs/ci-cd.md)
- [ADRs](docs/adr)

## Narrativa do Projeto

Um sistema de assinaturas SaaS desenvolvido como case técnico fullstack, com foco em arquitetura modular, processamento assíncrono com RabbitMQ, webhooks idempotentes, PostgreSQL, testes automatizados, observabilidade, CI/CD e deploy real.

---

## Monorepo

Gerenciado com **pnpm workspaces + Turborepo**.

```
apps/
  api/       # Fastify + TypeScript (HTTP, regras síncronas, publica eventos)
  worker/    # consumidores RabbitMQ (efeitos assíncronos + webhooks)
  web/       # Next.js (console administrativo)
packages/
  contracts/ # eventos, routing keys, filas, DTOs (fonte única de verdade)
  config/    # tsconfig base compartilhado
```

## Requisitos

- Node.js 22+
- pnpm 10+ (`corepack enable`)
- Docker + Docker Compose

## Rodar tudo com Docker (stack completa)

```bash
cp .env.example .env      # ajuste se quiser
docker compose up --build
```

Sobe PostgreSQL, RabbitMQ, API, worker e web. Endpoints:

- Web: http://localhost:3000
- API health: http://localhost:3333/health · métricas: http://localhost:3333/metrics
- RabbitMQ management: http://localhost:15672 (user/senha do `.env`)

As portas do host são configuráveis para evitar conflitos:
`POSTGRES_HOST_PORT`, `RABBITMQ_HOST_PORT`, `RABBITMQ_MGMT_PORT`, `API_HOST_PORT`, `WEB_HOST_PORT`.

## Rodar em modo desenvolvimento (hot reload)

```bash
pnpm install
docker compose up -d postgres rabbitmq   # só a infraestrutura
pnpm dev                                  # api + worker + web em watch
```

## Scripts (raiz)

```bash
pnpm build        # build de todos os pacotes (turbo)
pnpm typecheck    # tsc --noEmit em todos os pacotes
pnpm lint         # eslint
pnpm test         # vitest
pnpm format       # prettier --write
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`): a cada push/PR roda `lint → typecheck → test → build`.
- **Deploy** (`.github/workflows/deploy.yml`): em push na `main`, builda as imagens `sbs-api`/`sbs-worker`/`sbs-web`, publica no **GHCR** e faz deploy no VPS por SSH (`docker compose -f docker-compose.prod.yml pull && up -d`), com Caddy fazendo TLS automático.

### Configuração do deploy (uma vez)

1. **Secrets** do repositório: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (e opcional `VPS_SSH_PORT`).
2. **Variável** do repositório: `DEPLOY_ENABLED=true` (habilita o job de deploy).
3. No **VPS**, criar `~/sbs/.env` (baseado em `.env.example`) com `DOMAIN`, `ACME_EMAIL`, senhas do Postgres/RabbitMQ, `JWT_SECRET`.
4. **DNS**: apontar `app.<DOMAIN>` e `api.<DOMAIN>` para o IP do VPS (necessário para o TLS do Caddy).
