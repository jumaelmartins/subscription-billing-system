# Domain Model

## Entidades Principais

### User

Representa um usuário administrador do sistema.

Campos:

- id
- name
- email
- password_hash
- role
- created_at
- updated_at

### Customer

Representa um cliente ou empresa assinante.

Campos:

- id
- name
- email
- document
- status
- created_at
- updated_at

### Plan

Representa um plano comercial.

Campos:

- id
- name
- description
- price
- billing_cycle
- max_users
- max_projects
- status
- created_at
- updated_at

### PlanFeature

Representa recursos disponíveis em cada plano.

Campos:

- id
- plan_id
- feature_key
- feature_name
- enabled
- limit_value

### Subscription

Representa a assinatura de um cliente.

Campos:

- id
- customer_id
- plan_id
- status
- trial_start_at
- trial_end_at
- current_period_start
- current_period_end
- canceled_at
- created_at
- updated_at

Status:

```txt
trialing
active
past_due
paused
canceled
expired
```

### Invoice

Representa uma fatura gerada para uma assinatura.

Campos:

- id
- subscription_id
- customer_id
- status
- amount
- due_date
- paid_at
- created_at
- updated_at

Status:

```txt
open
paid
failed
void
refunded
```

### Payment

Representa uma tentativa ou confirmação de pagamento.

Campos:

- id
- invoice_id
- provider
- provider_payment_id
- status
- amount
- paid_at
- failed_at
- created_at

Status:

```txt
pending
paid
failed
refunded
```

### WebhookEvent

Representa um evento recebido de um provedor fake.

Campos:

- id
- provider
- provider_event_id
- event_type
- payload
- status
- processed_at
- created_at

Status:

```txt
received
processing
processed
failed
ignored
```

Regra importante:

```txt
provider + provider_event_id deve ser único
```

### AuditLog

Representa eventos importantes do sistema.

Campos:

- id
- actor_type
- actor_id
- action
- entity_type
- entity_id
- metadata
- created_at

### EmailLog

Representa e-mails fake gerados pelo sistema.

Campos:

- id
- to
- subject
- body
- status
- event_type
- created_at

## Relações

```txt
Customer 1 --- N Subscriptions
Plan 1 --- N Subscriptions
Subscription 1 --- N Invoices
Invoice 1 --- N Payments
WebhookEvent 1 --- 0/1 PaymentEvent
```

## Ciclo de Vida da Assinatura

```txt
trialing → active → past_due → canceled
```

Estados alternativos:

```txt
paused
expired
```

## Eventos de Domínio

```txt
subscription.created
subscription.activated
subscription.plan_changed
subscription.canceled
subscription.reactivated
invoice.created
invoice.paid
invoice.payment_failed
payment.webhook.received
payment.webhook.processed
notification.email.requested
audit.event.created
```
