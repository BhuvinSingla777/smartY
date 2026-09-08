# BDG & PODS Analytics Dashboard — Implementation Plan

## Status: Converted to Next.js 15 for Vercel

Single Next.js App Router application (`src/`) with Prisma, MUI, and the original import pipeline. NestJS (`apps/api`) and Vite (`apps/web`) have been replaced.

## Architecture

```
src/app/          Pages + API route handlers
src/components/   Layout and feature views
src/lib/          Services, parsers, shared helpers
prisma/           PostgreSQL schema and migrations
docker-compose.yml PostgreSQL on host port 5435
```
