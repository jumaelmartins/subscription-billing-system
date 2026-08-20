# ADR 0003 — PostgreSQL as Main Database

## Status

Accepted

## Context

O domínio de assinaturas é altamente relacional, envolvendo clientes, planos, assinaturas, faturas, pagamentos, webhooks e auditoria.

## Decision

Usaremos PostgreSQL como banco de dados principal.

## Consequences

### Positivas

- bom suporte a transações;
- constraints fortes;
- excelente para modelagem relacional;
- amplamente usado em SaaS;
- bom valor para portfólio e vagas internacionais.

### Negativas

- exige atenção ao design das migrations;
- exige entendimento correto de transações e índices.
