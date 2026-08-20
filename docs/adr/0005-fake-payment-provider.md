# ADR 0005 — Fake Payment Provider for MVP

## Status

Accepted

## Context

O objetivo do projeto é demonstrar arquitetura, domínio e confiabilidade, não realizar cobranças reais.

Integrar com um gateway real aumentaria esforço e dependências externas.

## Decision

O MVP usará um provedor de pagamento fake.

A aplicação poderá simular eventos como:

- invoice.paid
- invoice.payment_failed
- subscription.canceled

## Consequences

### Positivas

- reduz complexidade;
- facilita testes;
- evita dependência externa;
- permite foco em arquitetura;
- mantém o MVP viável.

### Negativas

- não demonstra integração real com gateway de pagamento;
- alguns detalhes de produção ficarão simplificados;
- integração real poderá ser adicionada no roadmap.
