# BDG & PODS Analytics Dashboard

Single **Next.js 15** App Router app for uploading, validating, importing, and visualizing **BDG** lead reports and **PODS** completion reports. Deploy on **Vercel**.

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
DATABASE_URL=
MAX_UPLOAD_SIZE_MB=20
UPLOAD_DIR=./uploads
```

On Vercel, set `DATABASE_URL` to a hosted Postgres URL (Neon, Supabase, or Railway). Prefer the connection pooler, and add `?pgbouncer=true` when using Prisma with a pooled URL.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Import the project in Vercel (framework: **Next.js**). If the git repo is a parent folder, set the root directory to `bdg-pods-dashboard`.
3. Add `DATABASE_URL` (and optionally `MAX_UPLOAD_SIZE_MB`).
4. Deploy. Prisma Client is generated in `postinstall` and `build`.

Run migrations against production Postgres:

```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
DATABASE_URL="your-production-url" npm run db:seed
```

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
