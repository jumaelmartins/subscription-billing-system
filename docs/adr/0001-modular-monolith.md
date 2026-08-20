# ADR 0001 — Modular Monolith

## Status

Accepted

## Context

O projeto precisa demonstrar arquitetura escalável, mas será desenvolvido por uma única pessoa e deve continuar viável para portfólio.

Uma arquitetura de microsserviços aumentaria a complexidade operacional sem necessidade real no MVP.

## Decision

Usaremos monólito modular.

Os módulos serão separados por domínio e responsabilidade, mantendo fronteiras claras dentro da mesma aplicação.

## Consequences

### Positivas

- menor complexidade operacional;
- desenvolvimento mais rápido;
- deploy mais simples;
- melhor para MVP;
- ainda permite extração futura de módulos.

### Negativas

- todos os módulos compartilham o mesmo processo de aplicação;
- exige disciplina para evitar acoplamento excessivo;
- escala horizontal granular por módulo não estará disponível no MVP.
