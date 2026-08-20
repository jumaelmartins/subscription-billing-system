# CI/CD

## Objetivo

Garantir que o projeto execute validações automáticas antes de merge/deploy.

## Pipeline Inicial

O GitHub Actions deve executar:

```txt
install
lint
typecheck
test
build
```

## Etapas

### 1. Install

Instala dependências.

### 2. Lint

Valida padrão de código.

### 3. Typecheck

Valida tipos TypeScript.

### 4. Test

Executa testes unitários e de integração.

### 5. Build

Gera build da API, frontend e worker.

## Pipeline Futuro

Após o MVP, o pipeline poderá incluir:

- build de imagens Docker;
- push para registry;
- deploy automático;
- migrations automáticas;
- smoke tests pós-deploy.
