# Technical Backlog

## EPIC 01 — Project Foundation

### Objetivo

Criar a base técnica do projeto.

### Tarefas

- [ ] Criar repositório no GitHub
- [ ] Definir nome do projeto
- [ ] Criar estrutura inicial de pastas
- [ ] Configurar TypeScript
- [ ] Configurar ESLint
- [ ] Configurar Prettier
- [ ] Criar Docker Compose
- [ ] Adicionar PostgreSQL ao Docker Compose
- [ ] Adicionar RabbitMQ ao Docker Compose
- [ ] Criar app API com Fastify
- [ ] Criar app Worker
- [ ] Criar app Web com Next.js
- [ ] Configurar variáveis de ambiente
- [ ] Validar env com Zod
- [ ] Configurar logger com Pino
- [ ] Criar endpoint `/health`
- [ ] Configurar Drizzle ORM
- [ ] Configurar migrations

## EPIC 02 — Authentication

### Objetivo

Permitir login administrativo.

### Tarefas

- [ ] Criar tabela `users`
- [ ] Criar seed de usuário admin
- [ ] Implementar hash de senha
- [ ] Criar endpoint de login
- [ ] Criar endpoint `/auth/me`
- [ ] Implementar JWT
- [ ] Proteger rotas privadas
- [ ] Criar testes de autenticação

## EPIC 03 — Customers

### Objetivo

Gerenciar clientes assinantes.

### Tarefas

- [ ] Criar tabela `customers`
- [ ] Criar schema de validação
- [ ] Criar endpoint de criação
- [ ] Criar endpoint de listagem
- [ ] Criar endpoint de detalhe
- [ ] Criar endpoint de atualização
- [ ] Criar endpoint de inativação
- [ ] Registrar audit log
- [ ] Criar testes

## EPIC 04 — Plans

### Objetivo

Gerenciar planos e features.

### Tarefas

- [ ] Criar tabela `plans`
- [ ] Criar tabela `plan_features`
- [ ] Criar CRUD de planos
- [ ] Criar configuração de limites
- [ ] Criar seeds de planos
- [ ] Criar testes

## EPIC 05 — Subscriptions

### Objetivo

Gerenciar ciclo de vida das assinaturas.

### Tarefas

- [ ] Criar tabela `subscriptions`
- [ ] Definir estados da assinatura
- [ ] Criar assinatura
- [ ] Criar assinatura com trial
- [ ] Alterar plano
- [ ] Cancelar assinatura
- [ ] Reativar assinatura
- [ ] Publicar eventos de domínio
- [ ] Criar testes de transição de status

## EPIC 06 — Invoices and Payments

### Objetivo

Gerenciar faturas e pagamentos simulados.

### Tarefas

- [ ] Criar tabela `invoices`
- [ ] Criar tabela `payments`
- [ ] Gerar fatura
- [ ] Simular pagamento
- [ ] Simular falha de pagamento
- [ ] Atualizar status da assinatura
- [ ] Criar testes de billing

## EPIC 07 — RabbitMQ Events

### Objetivo

Adicionar mensageria assíncrona.

### Tarefas

- [ ] Configurar conexão RabbitMQ
- [ ] Criar exchange `billing.events`
- [ ] Criar publisher
- [ ] Criar consumers
- [ ] Criar fila de billing
- [ ] Criar fila de notifications
- [ ] Criar fila de audit
- [ ] Criar DLQ
- [ ] Criar logs dos consumers

## EPIC 08 — Webhooks

### Objetivo

Implementar webhooks fake e idempotência.

### Tarefas

- [ ] Criar tabela `webhook_events`
- [ ] Criar constraint única para `provider + provider_event_id`
- [ ] Criar endpoint `/webhooks/fake-payment-provider`
- [ ] Salvar evento recebido
- [ ] Publicar `payment.webhook.received`
- [ ] Processar webhook no worker
- [ ] Ignorar evento duplicado
- [ ] Tratar evento inválido
- [ ] Enviar falhas para DLQ
- [ ] Criar testes de idempotência

## EPIC 09 — Admin Frontend

### Objetivo

Criar interface administrativa.

### Tarefas

- [ ] Criar layout admin
- [ ] Criar tela de login
- [ ] Criar dashboard
- [ ] Criar tela de clientes
- [ ] Criar tela de planos
- [ ] Criar tela de assinaturas
- [ ] Criar tela de faturas
- [ ] Criar tela de webhooks
- [ ] Criar tela de auditoria
- [ ] Adicionar filtros e badges de status

## EPIC 10 — Tests, CI and Observability

### Objetivo

Elevar maturidade técnica.

### Tarefas

- [ ] Criar testes unitários de domínio
- [ ] Criar testes de integração de endpoints críticos
- [ ] Criar testes de webhook duplicado
- [ ] Configurar GitHub Actions
- [ ] Rodar lint no CI
- [ ] Rodar typecheck no CI
- [ ] Rodar testes no CI
- [ ] Rodar build no CI
- [ ] Adicionar request ID
- [ ] Adicionar logs estruturados
- [ ] Adicionar endpoint `/metrics`
- [ ] Configurar Swagger/OpenAPI

## EPIC 11 — Deploy and Final Documentation

### Objetivo

Publicar o projeto e preparar apresentação.

### Tarefas

- [ ] Definir estratégia de deploy
- [ ] Criar arquivo `.env.example`
- [ ] Criar README final
- [ ] Adicionar screenshots
- [ ] Adicionar diagramas
- [ ] Documentar arquitetura
- [ ] Documentar idempotência
- [ ] Documentar CI/CD
- [ ] Documentar observabilidade
- [ ] Criar roadmap futuro
- [ ] Preparar posts para LinkedIn
