# Observability

## Objetivo

Adicionar visibilidade mínima de produção ao sistema.

O foco do MVP será:

- logs estruturados;
- request ID;
- correlation ID;
- health check;
- métricas básicas;
- logs de workers;
- rastreabilidade de eventos.

## Logs Estruturados

O sistema usará Pino para gerar logs JSON.

Exemplo:

```json
{
  "level": "info",
  "event": "invoice.paid",
  "invoiceId": "inv_123",
  "customerId": "cus_456",
  "requestId": "req_789",
  "timestamp": "2026-01-01T10:00:00.000Z"
}
```

## Request ID

Toda request HTTP deve receber um identificador.

Esse identificador deve aparecer:

- nos logs da API;
- nos eventos publicados;
- nos logs dos workers, quando aplicável.

## Correlation ID

Eventos relacionados ao mesmo fluxo devem carregar um `correlationId`.

Exemplo:

```txt
webhook recebido
→ payment.webhook.received
→ invoice.paid
→ subscription.activated
→ notification.email.requested
```

Todos esses eventos devem compartilhar o mesmo `correlationId`.

## Health Check

Endpoint:

```txt
GET /health
```

Deve validar:

- API online;
- conexão com PostgreSQL;
- conexão com RabbitMQ.

## Métricas

Endpoint:

```txt
GET /metrics
```

Métricas iniciais:

- total de requests;
- duração de requests;
- total de webhooks recebidos;
- total de webhooks processados;
- total de webhooks duplicados;
- total de mensagens processadas por worker;
- total de mensagens enviadas para DLQ.

## Roadmap Futuro

- OpenTelemetry completo;
- Prometheus;
- Grafana;
- traces distribuídos;
- alertas;
- dashboard operacional.
