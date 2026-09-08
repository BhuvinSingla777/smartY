# smartY

BDG & PODS Analytics Dashboard. Single **Next.js 15** App Router app for uploading, validating, importing, and visualizing **BDG** lead reports and **PODS** completion reports. Deploy on **Vercel**.

## Folder structure

```text
src/
  app/
    (dashboard)/          Dashboard, BDG, PODS, Upload, Imports pages
    api/                  REST route handlers
    layout.tsx            Root layout, fonts, MUI providers
    page.tsx              Redirects to /dashboard
  components/
    layout/               Sidebar shell
    common/               KPI cards, loading/empty/error states
    dashboard/            Overview page
    bdg/                  BDG analytics
    pods/                 PODS list and detail
    uploads/              File upload + preview/commit
    imports/              Import history
  lib/
    shared/               Types, column maps, normalization
    parsers/              CSV, Excel, Word, PDF
    transforms/           BDG / PODS preview transforms
    services/             Domain logic
prisma/                   Schema, migrations, seed
sample-data/              Example BDG and PODS reports
```

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js 15 (App Router), React 19, TypeScript |
| UI | MUI, Recharts, Axios |
| API | Next.js Route Handlers under `src/app/api` |
| Database | PostgreSQL + Prisma |
| Parsers | Papa Parse, SheetJS, Mammoth, pdf-parse |
| Deploy | Vercel |

## Local setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

- App: http://localhost:3000
- Postgres (Docker): localhost **5435**

## Environment

```text
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require&schema=bdg_pods
DIRECT_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require&schema=bdg_pods
SUPABASE_URL=https://PROJECT_REF.supabase.co
MAX_UPLOAD_SIZE_MB=20
UPLOAD_DIR=./uploads
```

This app uses **Supabase Postgres** through Prisma. Tables live in the `bdg_pods` schema so they do not collide with other apps in the same project.

Local: copy `.env.example` to `.env` with the pooler URLs, then:

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

On Vercel this is required at **runtime**. The build can succeed without it, then every PODS/BDG query fails with an empty `DATABASE_URL`.

1. Vercel → Project → **Settings** → **Environment Variables**.
2. Add `DATABASE_URL` (transaction pooler, port **6543**) and `DIRECT_URL` (session pooler, port **5432**). Enable **Production** and **Preview**.
3. Redeploy. Then run migrations once against `DIRECT_URL`:

```bash
npx prisma migrate deploy
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel (framework: **Next.js**).
3. Set `DATABASE_URL` as described above.
4. Deploy. Prisma Client is generated in `postinstall` and `build`.

Vercel’s filesystem is ephemeral. Uploaded files go to `/tmp` on Vercel and `./uploads` locally. Import history and business data live in Postgres.

## API

- `GET /api/dashboard/summary`
- `GET|POST /api/bdg`, `GET /api/bdg/summary`, `GET /api/bdg/by-region`, `GET /api/bdg/top-members`, `GET /api/bdg/export`, `GET|PATCH|DELETE /api/bdg/:id`
- `GET|POST /api/pods`, `GET /api/pods/summary`, `GET /api/pods/status`, `GET /api/pods/completion`, `GET /api/pods/export`, `GET|PATCH|DELETE /api/pods/:id`, `GET /api/pods/:id/history`
- `POST|GET /api/uploads`, `GET /api/uploads/:id`
- `POST /api/imports/preview`, `POST /api/imports/commit`, `GET /api/imports`, `GET /api/imports/:id`

## Tests

```bash
npm test
```
