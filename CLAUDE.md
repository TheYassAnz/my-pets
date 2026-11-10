# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**my-pets** is an installable web app (PWA) for pet owners to maintain a digital health record for their animals, with AI-assisted data extraction from photos of prescriptions/health books and smart reminders for upcoming health deadlines.

## Stack

| Layer              | Technology                                          |
| ------------------ | --------------------------------------------------- |
| Front (PWA)        | Expo (TypeScript) exported for **web only** (react-native-web), Expo Router, NativeWind; hand-written service worker + manifest |
| Backend API        | NestJS + Prisma (TypeScript), deployed on Render (free plan: sleeps after 15 min, ~1 min wake-up) |
| Database           | Supabase PostgreSQL (**DB + Storage only** — no Supabase Auth, no RLS; `supabase-js` used **server-side only** in the API for Storage uploads, never in the front) |
| Auth               | Custom JWT (argon2); access token in memory, rotated refresh token in an httpOnly cookie (`mypets_rt`) |
| AI extraction      | Claude API (vision)                                 |
| Reminders          | Web Push (VAPID, `web-push`) + daily email digest (Resend) |

> **PWA pivot (2026-11-09)**: the project is no longer an iOS/Android app. The Expo front is exported as a single-page web app and **served by Vercel**, which proxies `/api/*` to the NestJS API on Render (so the browser stays same-origin; the API only answers under `/api`). Native code and non-MVP screens/modules (routines, documents, fake household) were removed. Since 2026-11-10 `api/` and `app/` live in **one git repo at the root** (`main`), with both former histories (my-pets_api, my-pets_app) imported under their folder; the old `.git` dirs are kept in `.git-backup/` (ignored). Plan: `docs/superpowers/plans/2026-11-09-refonte-pwa.md`. Not yet done: desktop layout (plan 2) and real multi-user household (plan 3).

> **Hosting (2026-11-10)**: Railway replaced by Render (`render.yaml` at the root, free plan, reminders disabled). Front moved to Vercel (Root Directory `app`, `app/vercel.json` rewrites `/api/:path*` to `https://my-pets.onrender.com/api/:path*`); Render serves the API only.

> **Pivot note**: the project moved from a Supabase BaaS design to a **custom NestJS + Prisma API**. Supabase is now used only as a managed Postgres database and object storage. Multi-tenant isolation is enforced in the API (ownership checks on `ownerId`), **not** by RLS. The authoritative roadmap lives in `.claude/roadmap-mvp.md`.

## Architecture

The app follows a three-tier flow, with a custom API layer between the web front and the database:

1. **CRUD** — The front talks to the **NestJS API** (never directly to the database). The API owns all business logic, validates every request (DTOs), and enforces that a user can only access their own data via `ownerId` ownership checks (guarded by a custom JWT auth guard). Prisma is the ORM against Supabase Postgres.

2. **AI extraction** — When a user photographs a prescription or paper health booklet: the front uploads the image to the API → API sends it to Claude vision → receives structured JSON (date, product, dosage, vet) → returns it to pre-fill the form → user validates before the API saves. **Auto-save without human confirmation is never acceptable.**

3. **Notifications** — An internal API cron job (`@nestjs/schedule`) runs daily, scans upcoming vaccine/treatment deadlines, and sends reminders by Web Push (to every stored browser subscription) and one digest email per owner, with configurable lead times (e.g. D-15, D-1). Push is enabled by a user click in the browser; on iOS it only works once the PWA is installed, email covers the rest. The cron is off unless `REMINDERS_ENABLED=true`; on the Render free plan it would not run anyway if the service is asleep at 8 am.

```
PWA (Expo web export, Expo Router, service worker)
        │  hosted on Vercel; /api/* proxied (rewrite) to Render
        │  same origin: /api (JWT Bearer + httpOnly refresh cookie)
        ▼
API NestJS + Prisma (Render)
   ├─ Auth JWT custom (argon2, refresh rotation)
   ├─ Ownership checks (ownerId) — no RLS
   ├─ @nestjs/schedule (daily cron → Web Push + email)
   └─ Claude API (vision) → structured JSON
        │                    (user validates before save)
   ┌────┴─────┐
   ▼          ▼
Supabase    Supabase
Postgres    Storage
(Prisma)    (photos, PDF)
```

## Repository layout

One git repo at the root; run npm commands from `api/` or `app/` (each has its own package.json).

```
api/          NestJS + Prisma backend
  prisma/schema.prisma   User, RefreshToken, Animal, HealthEvent (enum VACCINE|TREATMENT|VISIT)
  src/auth/              register/login/refresh/logout/me, JwtAuthGuard, @CurrentUser
  src/animals/           CRUD + POST /animals/:id/photo (profile photo upload)
  src/health-events/     nested CRUD under /animals/:animalId/events
  src/extraction/        POST /animals/:animalId/extractions — Claude vision → structured JSON (never auto-saved)
  src/notifications/     Web Push subscriptions + reminder settings + daily cron (@nestjs/schedule → web-push + Resend)
  src/export/            GET /animals/:animalId/export — full health record PDF (pdfkit)
  src/storage/           SupabaseStorageService (service-role key, server-side only)
app/          Expo front, web target only (Expo Router, NativeWind)
  src/app/               file-based routes: sign-in, sign-up, (app)/animals/…/events/…
  src/lib/               api.ts (HTTP client, in-memory token, single-flight refresh), auth-context.tsx, health-events.ts,
                         notifications.ts (Web Push subscription), pwa.ts (service worker registration),
                         dialog.ts (confirm/alert), export.ts (PDF browser download)
  public/                manifest.json, sw.js, icons, index.html template
  vercel.json            Vercel config: build:web, /api/* proxy to Render, SPA fallback, cache headers
  src/components/        shared UI incl. health-event-form.tsx
```

## Commands

```bash
# API (from api/)
npm run start:dev        # dev server with watch
npm run build && npm run start:prod
npm run lint / npm test
npx prisma migrate dev   # schema changes — DATABASE_URL in api/.env is the real remote Supabase DB: never run migrations without Yassine's explicit go-ahead
npx prisma studio

# Front (from app/)
npm run web              # Expo dev server, web (http://localhost:8081)
npm run lint / npm test
npm run build:web        # export the PWA to app/dist (Vercel runs it on deploy)
```

API env vars (`api/.env`): `DATABASE_URL`, `DIRECT_URL`, `PORT`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANIMAL_PHOTOS_BUCKET`, `RESEND_API_KEY`, `EMAIL_FROM`, `ANTHROPIC_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `REMINDERS_ENABLED` (reminders run only when `true`), `CORS_ORIGIN` (dev only, `http://localhost:8081`).

Front env vars (`app/.env`): `EXPO_PUBLIC_API_URL` (`http://localhost:3000/api` in dev; forced to `/api` by `build:web`), `EXPO_PUBLIC_VAPID_PUBLIC_KEY`.

## Development phases (roadmap)

Authoritative source: `.claude/roadmap-mvp.md`. Summary (8 phases, 0→7):

- **Phase 0** — Foundations: Expo + TypeScript init, NestJS + Prisma API init, Supabase Postgres connection, base schema (users, animals), hello-world API online + mobile calling it ✅
- **Phase 1** — Custom JWT auth: register/login/refresh endpoints, argon2 hashing, NestJS guards, mobile auth screens + secure token storage (OAuth deferred to V2) ✅
- **Phase 2** — Animal management: animal CRUD API (NestJS modules, DTOs), profile photo upload to object storage, mobile create/list/edit/delete screens ✅ *(code complete)*
- **Phase 3** — Manual health events: Prisma model for vaccines/treatments/visits, CRUD endpoints, manual entry forms, chronological timeline per animal ✅ *(code complete)*
- **Phase 4** — AI extraction: camera/gallery via expo-image-picker, API endpoint → Claude vision → structured JSON, mandatory validation/correction UI before save ✅ *(code complete — **temporarily disabled**: API returns 503 without `ANTHROPIC_API_KEY`, mobile UI hidden behind `AI_EXTRACTION_ENABLED = false` in `app/src/lib/features.ts`)*
- **Phase 5** — Notifications: internal API cron (`@nestjs/schedule`) scanning deadlines, Expo Notifications + permissions, configurable reminders (D-15, D-1) ✅ *(code complete — push requires EAS projectId + development build)*
- **Phase 6** — PDF export of full health record (pdfkit) + share sheet + simple onboarding + UI polish ✅ *(code complete)*
- **Phase 7** — Beta testing (5-10 users), production monitoring/logs, API deployment on Render (free plan), PWA on Vercel, Blueprint `render.yaml` (no store submission since the 2026-11-09 PWA pivot)

> Phase descriptions above predate the PWA pivot: "mobile" screens are now web screens, Phase 5 push is Web Push + email (no EAS), Phase 1 token storage is an httpOnly cookie.

## Key architectural decisions

- **Custom NestJS + Prisma API over Supabase BaaS**: full control over business logic and validation; Supabase kept only as managed Postgres + Storage. Trade-off: more maintenance than a BaaS (monitoring, security updates, schema migrations)
- **Expo over bare React Native**: avoids Xcode/Android Studio native config at MVP stage; easier camera, notifications, and OTA updates
- **Custom JWT auth over Supabase Auth**: argon2 passwords, short-lived access token + rotated opaque refresh tokens (sha256-hashed at rest); ownership checks in the API replace RLS
- **Claude vision as MVP differentiator**: competitors (Pawprint, 11pets, PetDesk) rely on manual entry; AI extraction is the core value proposition
- **No auto-save on AI extraction**: non-negotiable UX principle — extraction pre-fills the form, the user always confirms

## Collaboration rules

- Always start every response with "Yassine" as the first word.
- If a request lacks enough detail to act confidently, ask targeted clarifying questions before proceeding — don't assume or produce a half-informed result.

## Out of scope for MVP

Vet/pet-sitter sharing, multi-user per animal, weight tracking charts, B2B vet partnerships, paid subscription.
