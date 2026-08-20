# Architecture

## Visão Geral

O sistema será construído como um monólito modular com workers assíncronos.

A API principal será responsável por autenticação, regras síncronas, exposição dos endpoints HTTP e publicação de eventos.

Os workers serão responsáveis por processar tarefas assíncronas, como webhooks, faturas, notificações fake e auditoria.

```txt
┌──────────────────┐
│     Frontend     │
│     Next.js      │
└────────┬─────────┘
         │ HTTP
         ▼
┌──────────────────┐
│   API Backend    │
│ Fastify + TS     │
└────┬───────┬─────┘
     │       │
     │       │ publish events
     │       ▼
     │  ┌──────────────┐
     │  │   RabbitMQ   │
     │  └──────┬───────┘
     │         │
     ▼         ▼
┌──────────┐ ┌────────────────────┐
│PostgreSQL│ │      Workers       │
└──────────┘ │ Billing/Webhook    │
             │ Notification/Audit │
             └────────────────────┘
```

## Estratégia Arquitetural

### Monólito Modular

O sistema será um monólito modular, não uma arquitetura de microsserviços.

Motivos:

- reduz complexidade operacional;
- facilita desenvolvimento individual;
- mantém o projeto terminável;
- permite boa separação de responsabilidades;
- continua sendo escalável em nível arquitetural;
- permite extração futura de módulos para serviços separados.

## Módulos

```txt
auth
users
customers
plans
subscriptions
invoices
payments
webhooks
billing
notifications
audit
observability
```

## Estrutura Sugerida

```txt
subscription-billing-system/
  apps/
    api/
      src/
        modules/
          auth/
          users/
          customers/
          plans/
          subscriptions/
          invoices/
          payments/
          webhooks/
          billing/
          notifications/
          audit/
        shared/
          database/
          logger/
          config/
          errors/
          http/
          messaging/
          observability/
    web/
      src/
        app/
        components/
        features/
        lib/
    worker/
      src/
        consumers/
        handlers/
        shared/
  packages/
    contracts/
    config/
  docs/
  docker-compose.yml
  README.md
```

## RabbitMQ

### Exchange Principal

```txt
billing.events
```

Tipo:

```txt
topic
```

### Routing Keys

```txt
subscription.created
subscription.activated
subscription.canceled
subscription.plan_changed
invoice.created
invoice.paid
invoice.payment_failed
payment.webhook.received
payment.webhook.processed
notification.email.requested
audit.event.created
```

### Filas

```txt
billing.webhooks.queue
billing.invoices.queue
billing.notifications.queue
billing.audit.queue
billing.analytics.queue
billing.dead-letter.queue
```

## Princípios

- a API não deve processar tarefas longas dentro da request HTTP;
- eventos críticos devem ser persistidos no banco;
- RabbitMQ será usado para desacoplar processamento assíncrono;
- consistência crítica será protegida por transações e constraints;
- logs devem carregar requestId/correlationId;
- módulos devem ter fronteiras claras.
