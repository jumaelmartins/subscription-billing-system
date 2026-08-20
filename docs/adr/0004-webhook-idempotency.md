# ADR 0004 — Webhook Idempotency

## Status

Accepted

## Context

Webhooks de pagamento podem ser enviados mais de uma vez por provedores externos.

Processar eventos duplicados pode causar inconsistência financeira e operacional.

## Decision

Todo webhook será persistido em `webhook_events`.

A combinação `provider + provider_event_id` será única.

Eventos duplicados serão reconhecidos, mas não reprocessados.

## Consequences

### Positivas

- evita pagamentos duplicados;
- aumenta confiabilidade do domínio;
- demonstra maturidade técnica;
- facilita auditoria.

### Negativas

- adiciona complexidade ao fluxo de webhook;
- exige testes de duplicidade;
- exige regras claras para eventos parcialmente processados.
