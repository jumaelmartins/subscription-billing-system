# Webhooks and Idempotency

## Problema

Provedores de pagamento podem enviar o mesmo webhook mais de uma vez. Isso pode acontecer por timeout, falha de rede, retry automático ou inconsistência temporária.

Se o sistema processar o mesmo evento duas vezes, pode gerar:

- pagamento duplicado;
- fatura marcada incorretamente;
- eventos de auditoria duplicados;
- e-mails duplicados;
- inconsistência no status da assinatura.

## Estratégia

Todo webhook recebido será persistido na tabela `webhook_events` antes de ser processado.

A combinação abaixo deve ser única:

```txt
provider + provider_event_id
```

Se um evento já existir, o sistema deve retornar sucesso, mas não deve reprocessar a regra de negócio.

## Fluxo

```txt
Webhook recebido
→ validar payload básico
→ tentar inserir webhook_event
→ se duplicado: marcar/retornar ignored
→ se novo: publicar payment.webhook.received
→ worker processa evento
→ atualiza invoice/payment/subscription em transação
→ marca webhook_event como processed
```

## Regra Importante

RabbitMQ não substitui idempotência.

Mesmo com mensageria, a aplicação deve assumir que mensagens podem ser entregues mais de uma vez ou que um consumidor pode falhar após processar parcialmente uma ação.

Por isso, a consistência crítica fica no banco:

- constraints únicas;
- transações;
- checagem de status atual;
- atualização condicional.

## Cenários de Teste

- webhook novo deve ser processado;
- webhook duplicado deve ser ignorado;
- webhook de pagamento deve marcar invoice como paid;
- webhook de falha deve marcar invoice como failed;
- falha no processamento deve enviar mensagem para retry ou DLQ;
- evento inválido deve ser registrado como failed ou ignored.
