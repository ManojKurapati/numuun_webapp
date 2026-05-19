# Namo — Early Childhood Development Assessment Platform

AI-assisted developmental milestone monitoring for children aged 0–6.
This repository contains the **backend API**, the **parent web app**, the
**admin panel** and their supporting packages. See
[`docs/architecture/`](docs/architecture) for the plan and the architecture
decision records.

## Monorepo layout

```
apps/
  api/                  NestJS backend (modular monolith)
  web/                  Parent web app (Next.js 15)
  admin/                Admin panel (Next.js 15)
packages/
  questionnaire-engine/ deterministic, version-aware scoring engine
  ui/                   "Desert Bloom" design system — theme + primitives
  api-client/           typed API client (envelope + token refresh)
  types/                shared TypeScript contracts and enums
  validation/           shared Zod schemas
infrastructure/docker/  local Postgres + Redis
docs/architecture/      implementation plan + ADRs
```

## Apps & ports

| App   | Dev command                  | URL                     |
| ----- | ----------------------------- | ----------------------- |
| api   | `pnpm --filter @namo/api dev`   | http://localhost:4000/v1 |
| web   | `pnpm --filter @namo/web dev`   | http://localhost:3000   |
| admin | `pnpm --filter @namo/admin dev` | http://localhost:3001   |

## Prerequisites

- Node.js 20+
- pnpm 9 (`npm install -g pnpm`)
- Docker (for local PostgreSQL)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL + Redis
docker compose -f infrastructure/docker/docker-compose.yml up -d

# 3. Configure the API environment
cp apps/api/.env.example apps/api/.env

# 4. Generate the Prisma client, run migrations, seed sample data
pnpm --filter @namo/api db:generate
pnpm --filter @namo/api db:migrate
pnpm --filter @namo/api db:seed

# 5. Run the API in watch mode
pnpm --filter @namo/api dev
```

The API listens on `http://localhost:4000/v1`.

Seeded accounts (password `ChangeMe123!`): `admin@namo.local`,
`parent@namo.local`.

## Workspace scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `pnpm build`      | Build every package and app              |
| `pnpm test`       | Run all unit tests                       |
| `pnpm lint`       | Lint all packages                        |
| `pnpm typecheck`  | Type-check all packages                  |
| `pnpm format`     | Format the repository with Prettier      |

## API surface (v1)

All responses use the envelope `{ success, data }` or `{ success, error }`.

| Method & path                          | Role   | Purpose                          |
| --------------------------------------- | ------ | -------------------------------- |
| `POST /v1/auth/register`                | public | Parent self-registration         |
| `POST /v1/auth/login`                   | public | Log in                           |
| `POST /v1/auth/refresh`                 | public | Rotate tokens                    |
| `POST /v1/auth/logout`                  | public | Revoke a refresh token           |
| `GET  /v1/auth/me`                      | any    | Current user profile             |
| `POST /v1/children`                     | parent | Create a child profile           |
| `GET  /v1/children`                     | parent | List own children                |
| `GET  /v1/questionnaires/for-child/:id` | parent | Questionnaires for a child's age |
| `GET  /v1/questionnaires/:id`           | any    | Questionnaire with all questions |
| `POST /v1/assessments`                  | parent | Start / resume an assessment     |
| `POST /v1/assessments/:id/responses`    | parent | Submit selected answers          |
| `POST /v1/assessments/:id/complete`     | parent | Score and finalise               |
| `GET  /v1/assessments/:id`              | parent | Assessment detail + score        |
| `POST /v1/questionnaires`               | admin  | Author a questionnaire           |
| `POST /v1/questionnaires/:id/publish`   | admin  | Publish a draft                  |
| `GET  /v1/users`, `POST /v1/users`      | admin  | Manage users                     |
| `GET  /v1/admin/stats`                  | admin  | Platform dashboard metrics       |
| `GET  /v1/admin/children`               | admin  | All children                     |
| `GET  /v1/admin/assessments`            | admin  | All assessments                  |

## Not yet built

Voice mode, the questionnaire PDF ingestion pipeline, and cloud
infrastructure. Voice interaction is deferred by decision; parents answer
by selecting options.
