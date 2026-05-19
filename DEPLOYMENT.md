# Deploying Namo (testing environment)

Namo has **three deployable pieces**. They cannot all go on Vercel — Vercel only
hosts the frontend.

| Piece | What it is | Where it goes |
|-------|-----------|---------------|
| `apps/web` | Next.js parent web app | **Vercel** |
| `apps/api` | NestJS API (long-running server) | **Render** (or Railway / Fly.io) |
| Database | PostgreSQL | **Render Postgres** (or Neon / Supabase) |

> Why not the API on Vercel? It's a persistent NestJS server (`app.listen`,
> shutdown hooks, pino logging). Vercel runs short-lived serverless functions —
> the API needs an always-on Node host.

The current MVP does **not** need Redis, S3, or any AI keys to run.

---

## Step 0 — Push to GitHub

Vercel and Render both deploy from a Git repo.

```bash
git add -A && git commit -m "chore: prepare for deployment"
git remote add origin https://github.com/<you>/namo.git
git push -u origin main
```

`.env` files are git-ignored — never commit real secrets.

---

## Step 1 + 2 — Database & API on Render (one Blueprint)

The repo includes [`render.yaml`](./render.yaml), which provisions the Postgres
database **and** the API together.

1. In Render → **New → Blueprint** → select your repo.
2. Render reads `render.yaml` and creates `namo-db` + `namo-api`.
   - `DATABASE_URL` is wired automatically from the database.
   - `JWT_ACCESS_SECRET` is auto-generated.
3. Leave `CORS_ORIGINS` blank for now — you'll fill it in Step 4.
4. Deploy. Note the API URL, e.g. `https://namo-api.onrender.com`.

The `startCommand` runs `prisma migrate deploy` on every deploy, so the schema
is created automatically on first launch.

> Free Render services cold-start (~30–60 s) after 15 min idle, and the free
> database expires after 30 days. Fine for testing; upgrade for anything real.

**Prefer Neon/Supabase for the DB?** Provision Postgres there, copy its
connection string (append `?sslmode=require`), and set it as `DATABASE_URL` on
the API service instead of using the `render.yaml` database block.

---

## Step 3 — Seed the database

Migrations run automatically; the **seed** (admin/parent accounts + all 21
ASQ-3 questionnaires) must be run once. From your machine, pointed at the live DB:

```bash
cd apps/api
DATABASE_URL="<your-live-database-url>" pnpm db:seed
```

Or run it from the Render service **Shell** tab: `pnpm db:seed`.

Seed accounts (change the password for anything beyond testing):
`admin@namo.local` / `parent@namo.local` — password `ChangeMe123!`
(override with `SEED_PASSWORD=...`).

---

## Step 4 — Web app on Vercel

1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory: `apps/web`** ← the only setting that really matters.
   Build/install commands come from [`apps/web/vercel.json`](./apps/web/vercel.json)
   (it builds the workspace packages via Turborepo first).
3. Add an Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://namo-api.onrender.com/v1`
     *(your API URL — **must include `/v1`**)*
4. Deploy. Note the web URL, e.g. `https://namo-web.vercel.app`.

> `NEXT_PUBLIC_*` values are baked in at build time. If the API URL changes,
> redeploy the web app.

---

## Step 5 — Connect CORS

The browser blocks API calls from an origin the API doesn't allow. On the Render
`namo-api` service, set:

- `CORS_ORIGINS` = `https://namo-web.vercel.app`

Add Vercel preview URLs comma-separated if you need them. Redeploy the API.

---

## Environment variable reference

### API (Render `namo-api`)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `JWT_ACCESS_SECRET` | ✅ | ≥16 chars — `openssl rand -base64 32` |
| `CORS_ORIGINS` | ✅ | Vercel web URL(s), comma-separated |
| `NODE_ENV` | – | `production` |
| `PORT` | – | Render sets this automatically |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL_DAYS` / `LOG_LEVEL` | – | Have sensible defaults |

### Web (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_API_URL` | ✅ | API base URL **including `/v1`** |

---

## Sanity checks

```bash
curl https://namo-api.onrender.com/v1/health     # -> {"status":"ok","database":"up",...}
```

Then open the Vercel URL, sign in with `parent@namo.local`, add a child, and
start a check-in — the age-matched ASQ-3 questionnaire should load.

## Admin app (optional)

`apps/admin` deploys exactly like the web app: a second Vercel project with
**Root Directory `apps/admin`** and the same `NEXT_PUBLIC_API_URL`. Add its URL
to the API's `CORS_ORIGINS` too.
