# User Flows

## 1. Criar Cliente

Ator: administrador.

Fluxo:

1. Administrador acessa tela de clientes.
2. Clica em novo cliente.
3. Informa nome, e-mail e documento.
4. Sistema valida dados.
5. Sistema cria cliente com status ativo.
6. Sistema registra audit log.

Resultado:

- cliente criado;
- evento de auditoria registrado.

## 2. Criar Plano

Ator: administrador.

Fluxo:

1. Administrador acessa tela de planos.
2. Clica em novo plano.
3. Informa nome, preço, ciclo e limites.
4. Sistema valida dados.
5. Sistema cria plano.
6. Sistema registra audit log.

Resultado:

- plano criado;
- plano disponível para assinatura.

## 3. Criar Assinatura

Ator: administrador.

Fluxo:

1. Administrador acessa o cliente.
2. Clica em criar assinatura.
3. Seleciona um plano.
4. Define se haverá trial.
5. Sistema cria assinatura.
6. Sistema publica evento `subscription.created`.
7. Worker de auditoria registra evento.
8. Worker de notificação gera e-mail fake.
9. Worker de billing cria fatura, se aplicável.

Resultado:

- assinatura criada;
- eventos assíncronos processados.

## 4. Gerar Fatura

Ator: sistema ou administrador.

Fluxo:

1. Sistema identifica assinatura que precisa de cobrança.
2. Publica evento para geração de fatura.
3. Worker cria invoice.
4. Sistema publica evento `invoice.created`.
5. Worker de notificação gera e-mail fake.

Resultado:

- fatura criada com status `open`.

## 5. Simular Pagamento

Ator: administrador.

Fluxo:

1. Administrador acessa uma fatura aberta.
2. Clica em simular pagamento.
3. Sistema gera evento fake de pagamento.
4. Sistema envia o evento para o endpoint de webhook.
5. Webhook é salvo em `webhook_events`.
6. Sistema publica `payment.webhook.received`.
7. Worker processa webhook.
8. Invoice é marcada como `paid`.
9. Payment é criado como `paid`.
10. Assinatura é marcada como `active`.
11. Sistema publica `invoice.paid`.

Resultado:

- fatura paga;
- assinatura ativa;
- webhook processado com idempotência;
- audit log registrado.

## 6. Simular Falha de Pagamento

Ator: administrador.

Fluxo:

1. Administrador acessa uma fatura aberta.
2. Clica em simular falha.
3. Sistema gera evento fake de falha.
4. Webhook é recebido.
5. Worker processa o evento.
6. Invoice é marcada como `failed`.
7. Assinatura é marcada como `past_due`.
8. Sistema publica `invoice.payment_failed`.
9. Worker de notificação gera e-mail fake.

Resultado:

- fatura marcada como falha;
- assinatura marcada como inadimplente.

## 7. Cancelar Assinatura

Ator: administrador.

Fluxo:

1. Administrador acessa uma assinatura.
2. Clica em cancelar.
3. Informa motivo opcional.
4. Sistema altera status para `canceled`.
5. Sistema registra `canceled_at`.
6. Sistema publica `subscription.canceled`.
7. Worker de auditoria registra evento.
8. Worker de notificação gera e-mail fake.

Resultado:

- assinatura cancelada;
- eventos registrados.

## 8. Processar Webhook Duplicado

Ator: sistema.

Fluxo:

1. Webhook chega com `provider_event_id`.
2. Sistema tenta inserir evento em `webhook_events`.
3. Caso o evento já exista, sistema retorna sucesso sem reprocessar.
4. Nenhuma fatura ou pagamento é duplicado.

Resultado:

- evento duplicado ignorado;
- sistema permanece consistente.
