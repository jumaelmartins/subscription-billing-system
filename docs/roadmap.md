# Roadmap

## Fase 0 — Planejamento e Documentação

Objetivo: fechar escopo antes de codar.

Entregas:

- definição do nome do projeto;
- documentação do MVP;
- requisitos funcionais;
- requisitos não funcionais;
- requisitos técnicos;
- fluxos principais;
- arquitetura inicial;
- modelo de domínio;
- backlog inicial;
- desenho do banco;
- decisões arquiteturais iniciais.

## Fase 1 — Fundação Técnica

Objetivo: criar base sólida do projeto.

Entregas:

- repositório GitHub;
- estrutura de pastas;
- Docker Compose;
- PostgreSQL;
- RabbitMQ;
- API Fastify;
- frontend Next.js;
- worker;
- Drizzle;
- migrations;
- env validation;
- logger;
- health check;
- lint;
- formatter;
- scripts de desenvolvimento.

## Fase 2 — Domínio Base

Objetivo: implementar entidades principais.

Entregas:

- users;
- auth;
- customers;
- plans;
- plan features;
- subscriptions;
- migrations;
- seeds;
- testes básicos.

## Fase 3 — Billing Core

Objetivo: implementar a lógica principal de assinatura e cobrança.

Entregas:

- criação de assinatura;
- trial;
- alteração de plano;
- cancelamento;
- reativação;
- criação de invoice;
- invoice status;
- payment status;
- regras de transição de status;
- testes de domínio.

## Fase 4 — RabbitMQ e Workers

Objetivo: implementar processamento assíncrono.

Entregas:

- conexão RabbitMQ;
- exchange `billing.events`;
- filas principais;
- publisher;
- consumers;
- worker de billing;
- worker de notification fake;
- worker de audit log;
- logs dos workers.

## Fase 5 — Webhooks e Idempotência

Objetivo: implementar o fluxo mais importante do case técnico.

Entregas:

- endpoint fake de webhook;
- tabela `webhook_events`;
- constraint única;
- processamento assíncrono;
- evento duplicado ignorado;
- retry;
- DLQ;
- testes de idempotência;
- documentação específica do fluxo.

## Fase 6 — Frontend Admin

Objetivo: criar interface apresentável para demonstração.

Entregas:

- login;
- layout administrativo;
- dashboard;
- tela de clientes;
- tela de planos;
- tela de assinaturas;
- tela de faturas;
- tela de webhooks;
- tela de auditoria;
- feedback visual para status.

## Fase 7 — Qualidade, Observabilidade e CI

Objetivo: elevar maturidade técnica do projeto.

Entregas:

- testes unitários;
- testes de integração;
- typecheck;
- lint;
- GitHub Actions;
- logs estruturados;
- request ID;
- métricas básicas;
- documentação OpenAPI.

## Fase 8 — Deploy e Documentação Final

Objetivo: transformar o projeto em case público.

Entregas:

- deploy frontend;
- deploy backend;
- deploy banco/RabbitMQ ou ambiente gerenciado;
- README completo;
- screenshots;
- diagramas;
- documentação técnica;
- ADRs;
- roadmap futuro;
- posts para LinkedIn.
