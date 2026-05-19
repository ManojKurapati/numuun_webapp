# Namo — Implementation Plan

Version: 1.0
Status: Approved (planning) — no application code written yet
Source spec: `/claude.md` (Namo Master Implementation Guide v1.0)

This document is the agreed implementation plan. It reconciles the master
guide with four scoping decisions made at kickoff:

1. **Plan-first** — produce this plan before any code.
2. **Mobile deferred** — build web + admin + api now; `mobile` reserved.
3. **Provider-agnostic AI** — no LLM vendor lock-in.
4. **Custom questionnaire** — a configurable developmental questionnaire
   engine, *not* the proprietary ASQ-3 instrument verbatim.

See `decisions.md` for the full architecture decision records (ADRs).

---

## 1. Scope of the MVP

In scope now: `apps/web`, `apps/admin`, `apps/api`, shared `packages/*`,
local Python `services/*` stubs, lean managed hosting.

Deferred: `apps/mobile`, voice mode, CMS + PDF ingestion, EKS/Terraform,
predictive analytics, population dashboards.

---

## 2. Revised Monorepo Structure

```
/apps
  /web        Next.js 15 — parent / clinician experience
  /admin      Next.js 15 — admin, CMS, content review
  /api        NestJS modular monolith
  (/mobile    reserved — React Native, deferred)

/packages
  /ui             ShadCN-based shared components
  /design-system  design tokens (color, spacing, typography)
  /types          shared TypeScript API contracts
  /validation     Zod schemas (shared web + api)
  /questionnaire-engine   deterministic scoring + zone logic
  /utils          framework-agnostic helpers
  /analytics      typed analytics event definitions
  /config         shared runtime config helpers
  /eslint-config  shared lint rules
  /tsconfig       shared TS base configs

/services
  /ai-service     Python FastAPI — provider-agnostic LLM layer
  /voice-service  Python FastAPI — ASR / TTS (Phase 2)
  (recommendation-service — deferred; rule-based module lives in api)

/infrastructure
  /docker         Docker Compose for local dev
  /k8s            deferred to Phase 2
  /terraform      deferred to Phase 2

/docs
  /prd /architecture /api /security /db-schema
```

Difference from guide section 5: `mobile` reserved not built;
`asq-scoring` renamed `questionnaire-engine` (custom, configurable);
`recommendation-service` deferred (rule-based module in `api`).

---

## 3. Phased Roadmap

### Phase 0 — Foundation
- pnpm workspaces + Turborepo
- Shared `tsconfig`, `eslint-config`, Prettier, Husky pre-commit hooks
- Docker Compose: PostgreSQL + Redis
- GitHub Actions CI: lint → typecheck → test → build → security scan
- `apps/api` NestJS skeleton: health check, standard error envelope,
  request tracing, structured logging (pino), validated env config
- `apps/web` + `apps/admin` Next.js skeletons wired to `design-system` + `ui`
- Seed `packages/types`, `packages/validation`, `packages/design-system`
- Observability baseline: OpenTelemetry wiring + Sentry

### Phase 1 — Core MVP
1. Auth & RBAC — JWT access + refresh rotation; roles: parent,
   pediatrician, admin, gov_program, hospital; NestJS guards
2. Child profiles — `children` module + web onboarding flow
3. Questionnaire engine — `packages/questionnaire-engine` +
   `questions` / `responses` / `domain_scores` schema
4. Assessment flow — questionnaire module + web assessment UI
5. Dashboard + results — domain zones: NORMAL / GREY_ZONE / DELAY
6. Recommendation engine — rule-based NestJS module + activity output
7. Video playback — content / videos module + web player
8. Notifications — push / SMS / email behind adapters; quiet hours

### Phase 2 — Scale
Voice mode (`voice-service` + `ai-service`); CMS + questionnaire PDF
ingestion (OCR → extraction → human review → publish); admin analytics;
referral workflows + reporting; EKS + Terraform.

### Phase 3 — AI + Government Scale
Predictive analytics; ML recommendation layer; regional + population
dashboards; advanced analytics.

---

## 4. Scoring Model (Custom Questionnaire)

Per-response scoring stays as guide section 16 (YES=10, SOMETIMES=5,
NOT_YET=0), but is **configurable per questionnaire version** rather than
hardcoded to ASQ-3. The engine:
- is a pure, zero-dependency package
- is deterministic and version-aware
- carries 100% unit-test coverage
- computes domain scores = sum(question_scores) and maps to zones via
  version-defined thresholds

This keeps the platform legally clear of the proprietary ASQ-3 instrument
while preserving the clinical structure.

---

## 5. Standards Enforcement

The guide's "ABSOLUTE RULES" are enforced mechanically, not by convention:
- strict `tsconfig` + ESLint `no-explicit-any`
- a base Prisma model pattern enforcing `id`, `created_at`, `updated_at`,
  `deleted_at` + soft deletes
- Zod validation at every API boundary
- env-var config validation — no secrets in code
- a dedicated audit-logging module
- CI gates tests on all critical paths

---

## 6. Remaining Open Questions

- Notification vendors (FCM / Twilio / SES or SendGrid) — pick before
  Phase 1 step 8.
- Google Stitch design export (guide section 28) — needed before
  `design-system` tokens are finalized.
- Default LLM provider for local dev (adapter still agnostic).
