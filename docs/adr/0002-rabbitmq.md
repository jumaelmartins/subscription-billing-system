# ADR 0002 — RabbitMQ for Asynchronous Messaging

## Status

Accepted

## Context

O sistema precisa processar webhooks, faturas, notificações fake e auditoria sem executar tudo dentro da request HTTP.

Também existe interesse técnico em explorar mensageria usada em arquiteturas distribuídas.

## Decision

Usaremos RabbitMQ como broker de mensagens.

A comunicação assíncrona será feita por meio de uma exchange principal do tipo topic chamada `billing.events`.

## Consequences

### Positivas

- desacoplamento entre API e workers;
- processamento assíncrono;
- possibilidade de retry e DLQ;
- boa narrativa arquitetural para portfólio;
- arquitetura evolutiva para extração futura de serviços.

### Negativas

- mais uma dependência de infraestrutura;
- maior complexidade local e no deploy;
- exige cuidado com idempotência;
- exige observabilidade dos consumers.
