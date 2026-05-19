# Namo — External Services & API Keys

Reference for every third-party service required to run Namo in production.
Chosen providers: **LLM = Anthropic**, **OCR = Google Document AI**, **SMS = Twilio**.

All secrets belong in environment variables (see [`.env.example`](../.env.example)) or a
secrets manager (AWS Secrets Manager). Never commit real keys. Per CLAUDE.md §11: no
secrets in code.

---

## 1. AI / ML

| Service | Purpose | Env var(s) | Where to get it |
|---|---|---|---|
| Anthropic API | LLM structuring of ASQ extraction, recommendation engine | `ANTHROPIC_API_KEY` | console.anthropic.com |
| OpenAI API | Whisper ASR for voice mode (Phase 2 only) | `OPENAI_API_KEY` | platform.openai.com |
| ElevenLabs | Text-to-speech for voice-first UX (Phase 2) | `ELEVENLABS_API_KEY` | elevenlabs.io |

## 2. OCR — ASQ PDF Ingestion (Google Document AI)

| Item | Env var | Notes |
|---|---|---|
| Service-account JSON | `GOOGLE_APPLICATION_CREDENTIALS` | Download from GCP IAM; store outside repo |
| Project ID | `GCP_PROJECT_ID` | |
| Location | `GCP_LOCATION` | e.g. `us` or `eu` |
| Processor ID | `DOCUMENT_AI_PROCESSOR_ID` | Create a Document OCR / Form Parser processor |

## 3. AWS Infrastructure

One IAM user/role (least-privilege) covers S3, CloudFront, EKS, ECR, SQS.

| Resource | Purpose | Env var(s) |
|---|---|---|
| IAM credentials | Auth for all AWS SDK calls | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |
| S3 | Object storage — videos, PDFs, uploads | `S3_BUCKET` |
| CloudFront | Video CDN + signed URLs | `CLOUDFRONT_DOMAIN`, `CLOUDFRONT_KEY_PAIR_ID`, `CLOUDFRONT_PRIVATE_KEY` |
| EKS / ECR | Kubernetes cluster + container registry | deploy-time (CI secrets) |
| SQS | Async event queue between services | uses IAM creds |

## 4. Auth

| Item | Env var | Notes |
|---|---|---|
| JWT signing | `JWT_SECRET`, `JWT_REFRESH_SECRET` | Self-generated, 32+ random bytes |
| Google OAuth | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | GCP Credentials console |
| Apple Sign-In | `APPLE_OAUTH_TEAM_ID`, `APPLE_OAUTH_KEY_ID`, `APPLE_OAUTH_PRIVATE_KEY` | Required for the iOS app |

## 5. Notifications

| Channel | Service | Env var(s) |
|---|---|---|
| Push (Android) | Firebase Cloud Messaging | `FCM_PROJECT_ID`, `FCM_CREDENTIALS` |
| Push (iOS) | Apple APNs | `APNS_TEAM_ID`, `APNS_KEY_ID`, `APNS_PRIVATE_KEY` |
| SMS | Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| Email | SendGrid | `SENDGRID_API_KEY`, `EMAIL_FROM` |

## 6. Data Stores

Connection strings, not API keys — managed services recommended (RDS, ElastiCache, OpenSearch).

| Store | Env var |
|---|---|
| PostgreSQL | `DATABASE_URL` |
| Redis | `REDIS_URL` |
| Elasticsearch/OpenSearch | `ELASTICSEARCH_URL`, `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` |

## 7. Observability

| Service | Env var | Notes |
|---|---|---|
| Sentry | `SENTRY_DSN` | Error monitoring |
| Prometheus / Grafana | — | Self-hosted; no external key |
| OpenTelemetry collector | `OTEL_EXPORTER_OTLP_ENDPOINT` | |

## 8. CI/CD & Mobile (build-time secrets)

| Item | Where | Notes |
|---|---|---|
| GitHub Actions secrets | Repo settings | AWS creds, ECR login, env for deploy |
| Expo / EAS | `EXPO_TOKEN` | If mobile is React Native Expo |
| Google Play | Service-account JSON | App publishing |
| Apple App Store Connect | API key (.p8) + key ID + issuer ID | App publishing |

---

## Launch scope

### Phase 1 MVP — required now
`ANTHROPIC_API_KEY` · AWS creds (S3 + CloudFront) · Google Document AI service account ·
`DATABASE_URL` · `REDIS_URL` · `JWT_SECRET` / `JWT_REFRESH_SECRET` · Google OAuth ·
FCM + APNs · Twilio · SendGrid · `SENTRY_DSN`

### Phase 2 — defer until voice/search ship
`OPENAI_API_KEY` (Whisper) · `ELEVENLABS_API_KEY` (TTS) · Elasticsearch/OpenSearch

---

## Security checklist (CLAUDE.md §11)

- [ ] No secrets committed — `.env` and `secrets/` are git-ignored
- [ ] Production secrets in AWS Secrets Manager, not plain env files
- [ ] IAM credentials scoped least-privilege (no `*:*`)
- [ ] Key rotation policy defined for all providers
- [ ] Separate keys per environment (dev / staging / prod)
- [ ] CloudFront/APNs/GCP private keys stored as files outside the repo
