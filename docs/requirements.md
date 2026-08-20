# Requirements

## Requisitos Funcionais

### RF01 — Autenticação

O sistema deve permitir que um administrador faça login com e-mail e senha.

### RF02 — Gerenciar Clientes

O sistema deve permitir criar, listar, visualizar, atualizar e inativar clientes.

### RF03 — Gerenciar Planos

O sistema deve permitir criar, listar, visualizar, atualizar e inativar planos.

### RF04 — Gerenciar Features de Plano

O sistema deve permitir configurar limites e funcionalidades por plano.

### RF05 — Criar Assinaturas

O sistema deve permitir criar assinatura para um cliente a partir de um plano.

### RF06 — Alterar Plano

O sistema deve permitir alterar o plano de uma assinatura ativa.

### RF07 — Cancelar Assinatura

O sistema deve permitir cancelar uma assinatura.

### RF08 — Reativar Assinatura

O sistema deve permitir reativar uma assinatura cancelada ou inadimplente, quando aplicável.

### RF09 — Gerar Faturas

O sistema deve gerar faturas para assinaturas.

### RF10 — Simular Pagamento

O sistema deve permitir simular pagamento de uma fatura.

### RF11 — Simular Falha de Pagamento

O sistema deve permitir simular falha de pagamento.

### RF12 — Receber Webhooks

O sistema deve possuir endpoint para receber eventos fake de pagamento.

### RF13 — Processar Webhooks de Forma Idempotente

O sistema deve impedir processamento duplicado do mesmo evento de webhook.

### RF14 — Registrar Auditoria

O sistema deve registrar eventos relevantes em audit log.

### RF15 — Gerar Notificações Fake

O sistema deve registrar notificações fake em tabela de e-mails.

### RF16 — Dashboard Administrativo

O sistema deve exibir métricas básicas de clientes, assinaturas, faturas e receita simulada.

### RF17 — Visualizar Eventos

O sistema deve permitir visualizar eventos de auditoria e webhooks processados.

## Requisitos Não Funcionais

### RNF01 — Código Organizado

O sistema deve ter separação clara entre módulos, domínio, infraestrutura e interface HTTP.

### RNF02 — Baixo Acoplamento

Os módulos não devem depender diretamente de detalhes internos de outros módulos quando puderem se comunicar por serviços ou eventos.

### RNF03 — Observabilidade

O sistema deve possuir logs estruturados, request ID e health check.

### RNF04 — Confiabilidade

Operações críticas devem usar transações e constraints no banco.

### RNF05 — Idempotência

Webhooks e operações de pagamento devem ser idempotentes.

### RNF06 — Testabilidade

As regras principais devem ser cobertas por testes unitários e de integração.

### RNF07 — Segurança

O sistema deve armazenar senhas com hash seguro e proteger rotas privadas.

### RNF08 — Performance

Endpoints principais devem responder em tempo adequado para um MVP, evitando processamentos longos dentro da request HTTP.

### RNF09 — Escalabilidade Evolutiva

A arquitetura deve permitir extração futura de workers ou módulos para serviços separados.

### RNF10 — Documentação

O projeto deve possuir README, documentação técnica e decisões arquiteturais.

### RNF11 — Deploy Reprodutível

O ambiente deve poder ser executado localmente com Docker Compose.

### RNF12 — CI

O repositório deve executar lint, typecheck, testes e build automaticamente em pull requests ou pushes.

## Requisitos Técnicos

### RT01 — API

A API deve ser construída com Fastify e TypeScript.

### RT02 — Banco de Dados

O banco principal deve ser PostgreSQL.

### RT03 — ORM

O acesso ao banco deve ser feito com Drizzle ORM.

### RT04 — Migrations

O projeto deve possuir migrations versionadas.

### RT05 — Validação

Entradas externas devem ser validadas com Zod.

### RT06 — Mensageria

A comunicação assíncrona deve utilizar RabbitMQ.

### RT07 — Logs

Logs devem ser estruturados com Pino.

### RT08 — Configuração

Variáveis de ambiente devem ser validadas no startup da aplicação.

### RT09 — Documentação da API

A API deve expor documentação OpenAPI/Swagger.

### RT10 — Testes

O projeto deve usar Vitest para testes automatizados.

### RT11 — Containerização

API, frontend, worker, banco e RabbitMQ devem rodar com Docker Compose.

### RT12 — CI/CD

O projeto deve possuir pipeline no GitHub Actions.
