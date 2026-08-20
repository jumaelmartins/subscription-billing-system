# MVP Specification — Subscription Billing System

## 1. Visão Geral

O projeto será um sistema completo de gerenciamento de assinaturas para produtos SaaS, desenvolvido como case técnico de portfólio.

O objetivo não é criar um gateway de pagamento real, mas sim construir um sistema funcional que demonstre boas práticas de arquitetura backend/fullstack, modelagem de domínio, processamento assíncrono, idempotência, observabilidade, testes, CI/CD e deploy real.

## 2. Objetivo do Projeto

Criar uma aplicação fullstack para gerenciar:

- clientes;
- planos;
- assinaturas;
- faturas;
- pagamentos simulados;
- webhooks de pagamento;
- eventos de domínio;
- auditoria;
- dashboard administrativo.

## 3. Objetivo de Portfólio

Este projeto servirá como case técnico para demonstrar:

- arquitetura de monólito modular;
- separação de responsabilidades;
- uso de mensageria com RabbitMQ;
- processamento assíncrono com workers;
- webhooks idempotentes;
- modelagem relacional com PostgreSQL;
- documentação de decisões técnicas;
- testes automatizados;
- logs estruturados;
- métricas e health checks;
- pipeline CI/CD;
- deploy real;
- UI administrativa apresentável.

## 4. Escopo do MVP

### Dentro do Escopo

O MVP deve conter:

- autenticação de usuário administrador;
- cadastro e login;
- CRUD de clientes;
- CRUD de planos;
- criação de assinatura para cliente;
- alteração de plano;
- cancelamento de assinatura;
- reativação de assinatura;
- geração de faturas;
- simulação de pagamento;
- simulação de falha de pagamento;
- processamento de webhook fake;
- idempotência de webhooks;
- eventos assíncronos com RabbitMQ;
- workers para billing, notification e audit log;
- dashboard administrativo;
- listagem de eventos/auditoria;
- logs estruturados;
- health check;
- documentação OpenAPI/Swagger;
- testes unitários e de integração principais;
- CI com GitHub Actions;
- deploy da aplicação.

### Fora do Escopo

O MVP não terá:

- integração real com Stripe, Mercado Pago ou Pagar.me;
- cobrança real em cartão;
- emissão de nota fiscal;
- cálculo fiscal;
- multi-moeda;
- proration avançado;
- cupons/descontos complexos;
- split payment;
- billing usage-based;
- microsserviços separados;
- Kubernetes;
- event sourcing completo;
- multi-tenant avançado;
- painel financeiro complexo;
- app mobile;
- envio real de e-mails.

## 5. Critérios de Aceite

O MVP será considerado pronto quando:

- for possível criar cliente;
- for possível criar plano;
- for possível criar assinatura;
- for possível gerar fatura;
- for possível simular pagamento;
- for possível simular falha;
- webhook for processado de forma assíncrona;
- webhook duplicado não gerar inconsistência;
- audit log registrar eventos principais;
- dashboard exibir métricas básicas;
- frontend estiver navegável;
- testes principais estiverem passando;
- CI estiver configurado;
- aplicação estiver publicada;
- README explicar arquitetura e decisões.
