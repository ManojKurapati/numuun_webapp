# Namo — Architecture Decision Records

Companion to `implementation-plan.md`. Each ADR records a decision, the
context, and the rationale. Decisions resolve ambiguities and internal
conflicts in `/claude.md`.

---

## ADR-1 — Modular monolith for `apps/api`, not 13 microservices

**Context.** Guide section 4 specifies "microservices + event-driven" with
13 services; section 5 lists a single `/apps/api`. These conflict for an
8–12 week MVP.

**Decision.** One NestJS application with strictly bounded domain modules
(auth, users, children, assessments, scoring, recommendations, content,
notifications, analytics, audit). Cross-module communication uses an
in-process event bus behind an interface, swappable to SQS/Kafka later.
Each module remains extractable into a standalone service.

**Rationale.** 13 deployable services for an MVP is operational overhead
that contradicts the guide's own "low cognitive load" and "maintainability"
principles. Module boundaries preserve the future microservice path.

---

## ADR-2 — Mobile deferred, not designed out

**Decision.** Build `web` + `admin` + `api` now. Reserve `/apps/mobile`.
Keep shared packages (`types`, `validation`, `utils`,
`questionnaire-engine`) free of React/DOM dependencies.

**Rationale.** Kickoff decision to defer mobile. Framework-agnostic shared
packages let a future React Native app consume them unchanged.

---

## ADR-3 — Provider-agnostic AI layer

**Decision.** An `LLMProvider` interface (`complete`, `extractStructured`,
`classify`) with `AnthropicAdapter` and `OpenAIAdapter`, selected by
config. ASR and TTS sit behind their own interfaces. No provider SDK is
imported outside its adapter file.

**Rationale.** Kickoff decision; avoids vendor lock-in for extraction,
recommendations, and NLP classification.

---

## ADR-4 — Tooling: pnpm workspaces + Turborepo

**Decision.** pnpm workspaces + Turborepo for the TypeScript side. Python
services keep their own `pyproject.toml` and are orchestrated via Docker
Compose, outside the Turbo graph.

---

## ADR-5 — ORM: Prisma

**Decision.** Prisma against PostgreSQL.

**Rationale.** Strongest type-safety, clean migration workflow, and simple
enforcement of UUID primary keys and soft-delete + audit fields.

---

## ADR-6 — Custom configurable questionnaire engine

**Context.** ASQ-3 is a proprietary clinical instrument owned by Brookes
Publishing. Shipping it verbatim is a licensing risk.

**Decision.** Build a generic, configurable developmental questionnaire
engine in `packages/questionnaire-engine`. Scoring weights and zone
thresholds are configuration per questionnaire version, not hardcoded.
The package is pure, zero-dependency, deterministic, version-aware, and
fully unit-tested.

**Rationale.** Kickoff decision to use a custom ASQ-inspired questionnaire.
Configurability keeps the platform legally clear while preserving the
clinical structure.

---

## ADR-7 — Recommendation engine starts as a NestJS module

**Decision.** Implement the recommendation engine as a rule-based NestJS
module in `apps/api`. Create a separate Python `recommendation-service`
only when the Phase 3 ML layer arrives.

**Rationale.** Section 17 inputs (age, domain, severity, history) are
deterministic and rule-based for the MVP; a separate service is premature.

---

## ADR-8 — Web and admin are separate Next.js apps

**Decision.** `apps/web` (parent / clinician) and `apps/admin` (admin,
CMS, review) are separate Next.js applications.

**Rationale.** Different audiences, different security surfaces, and
distinct UX directions per guide section 26.

---

## ADR-9 — Lean managed hosting for the MVP

**Decision.** Host web/admin on Vercel; use managed PostgreSQL and Redis;
run `api` as a container on a managed platform. Defer EKS and Terraform to
Phase 2.

**Rationale.** Kickoff decision; prioritizes speed to ship. The guide's
full AWS + Terraform + EKS target remains the Phase 2 destination.

---

## ADR-10 — Shared contracts and validation

**Decision.** `packages/types` holds TypeScript API contracts;
`packages/validation` holds Zod schemas consumed by both web and api.
OpenAPI is generated from NestJS decorators. A single error envelope
(guide section 8) is used across all endpoints.
