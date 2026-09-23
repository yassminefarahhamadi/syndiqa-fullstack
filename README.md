# SyndiQA

> Smart property & syndicate (condominium) management platform — full-stack.
> **Angular 21** single-page app + **Spring Boot 3.4** REST API + **MongoDB**.

SyndiQA helps a *syndic* (building manager) run a residential organization end to
end: residents and leases, buildings and apartments, recurring charges and expenses,
maintenance requests, incident alerts, community events, and a set of optional
AI-assisted tools (document OCR, photo analysis, smart reminders).

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Repository structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Quick start (Docker)](#quick-start-docker)
7. [Manual setup](#manual-setup)
8. [Environment variables](#environment-variables)
9. [Running the app](#running-the-app)
10. [Ports & URLs](#ports--urls)
11. [Optional AI services](#optional-ai-services)
12. [Testing](#testing)
13. [Production build](#production-build)
14. [Contributing](#contributing)

---

## Features

| Domain | What it does |
|---|---|
| **Auth & users** | Registration, email verification, JWT access/refresh tokens, password reset, team invitations, role-based access control, login rate-limiting, audit log |
| **Organizations** | Multi-tenant syndicates, members, leases, lease inspections, tenant-risk scoring |
| **Property** | Buildings, residences, apartments, common areas, parking spots |
| **Financial** | Recurring charges, expenses, charge-distribution wizard, analytics dashboard, payment tracking |
| **Maintenance** | Requests, tasks, categories, severity levels, completion tracking, before/after photo comparison |
| **Incidents** | Incident reporting with photo/audio evidence, technician assignment & email notifications, processing timeline |
| **Community** | Community events, participations, community dashboard |
| **Gamification / Solar** | Solar-energy tracking with a gamification layer |
| **Announcements** | Organization-wide announcements with an AI writing assistant |
| **AI assist** *(optional)* | Google Gemini for OCR/vision/reminders; a local audio-classifier service; a prediction service |

---

## Tech stack

**Frontend**
- Angular 21 (standalone components, signals), TypeScript 5.9
- PrimeNG 21 + `@primeuix/themes` (Nora preset), Tailwind CSS 4, Angular Material
- Chart.js, Leaflet + markercluster, Quill
- RxJS, Angular CLI (`@angular-devkit/build-angular:application` builder)

**Backend**
- Java 17, Spring Boot 3.4.3 (Web, Security, Data MongoDB, Mail, AOP, Validation)
- JWT via `jjwt` 0.12.6, Bucket4j rate limiting, Twilio SMS SDK
- Lombok, Kotlin stdlib, JUnit 5 + Spring Security Test
- Maven (wrapper included)

**Data & infra**
- MongoDB 7 (local or MongoDB Atlas)
- Docker / Docker Compose
- Vercel (frontend static hosting) — `vercel.json`

---

## Architecture

```
Browser ──HTTP──▶ Angular SPA (:4200)
                        │  REST + JWT (Bearer)
                        ▼
              Spring Boot API (:8089) ──▶ MongoDB (:27017)
                        │
                        ├─▶ Google Gemini API        (optional, cloud)
                        ├─▶ Audio classifier service (optional, :8000)
                        └─▶ Prediction service       (optional, :3001)
```

**Backend layering** (`tn.esprit.pidev.<layer>`):
`controllers` → `services` → `repositories` → `entities`, with `dto`, `security`
(JWT filter, RBAC guards, org-isolation interceptor), `config`, `events`,
`exception`, `enums`.

**Frontend layering** (`src/app/`):
`core/` (auth, interceptors, guards, pipes, utils) · `layout/` · `features/` ·
`pages/` (feature screens) · `services/` · `models/`.

---

## Repository structure

```
syndiqa-fullstack/
├── backend/                     Spring Boot API
│   ├── src/main/java/tn/esprit/pidev/
│   │   ├── config/  controllers/  dto/  entities/  enums/
│   │   ├── events/  exception/  repositories/  security/  services/
│   │   └── PidevApplication.java
│   ├── src/main/resources/
│   │   ├── application.properties            # shared config (env-driven)
│   │   ├── application-local.properties      # default: local MongoDB
│   │   ├── application-dev.properties        # MongoDB Atlas (needs MONGODB_URI)
│   │   └── application-prod.properties       # production (env only)
│   ├── uploads/                 # runtime file uploads (git-ignored)
│   ├── Dockerfile
│   ├── mvnw / mvnw.cmd / pom.xml
│   └── README.md
├── frontend/                    Angular SPA
│   ├── src/
│   │   ├── app/  (core, layout, features, pages, services, models)
│   │   ├── environments/
│   │   ├── app.config.ts  app.routes.ts  app.component.ts  main.ts
│   │   └── index.html
│   ├── scripts/train-model.js   # offline model-weights generator
│   ├── Dockerfile / nginx.conf
│   ├── angular.json / package.json
│   └── README.md
├── scripts/
│   ├── seed-demo.mjs            # populate every module with demo data (API-only)
│   └── mock-ai.mjs             # local stubs: AI :3001 / :8000 + SMTP sink :1025
├── docker-compose.yml           # mongo + backend + frontend
├── .env.example                 # copy to .env
├── Makefile                     # convenience targets (Linux/macOS)
├── package.json                 # root scripts (npm run dev / seed:demo / mock:ai …)
└── README.md
```

---

## Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| **Docker + Compose** | latest | the one-command path |
| **Java JDK** | 17+ | manual backend |
| **Node.js** | 20+ | manual frontend + root scripts |
| **MongoDB** | 7 | manual backend (or use the Docker mongo) |
| Maven | — | not required, use the `./mvnw` wrapper |

---

## Quick start (Docker)

```bash
git clone <repository-url> syndiqa-fullstack
cd syndiqa-fullstack
cp .env.example .env          # Windows: copy .env.example .env
docker compose up --build
```

This starts **MongoDB**, the **API**, and the **frontend**. First build takes a few
minutes. Then open **http://localhost:4200**.

Stop with `Ctrl+C`, then `docker compose down` (add `-v` to also drop the database).

---

## Manual setup

### 1. Clone & configure

```bash
git clone <repository-url> syndiqa-fullstack
cd syndiqa-fullstack
cp .env.example .env
```

### 2. Start MongoDB

Any local MongoDB on `localhost:27017` works. Quickest:

```bash
docker run -d -p 27017:27017 --name cloud4saya-mongo mongo:7
```

### 3. Install dependencies

```bash
npm run install:all        # installs root + frontend deps
# backend deps are fetched on first ./mvnw run
```

---

## Environment variables

Copy `.env.example` to `.env` and adjust. Everything has a working local default
**except** the profiles below that talk to Atlas.

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `local` | `local` = local MongoDB · `dev`/`prod` = Atlas |
| `SERVER_PORT` | `8089` | backend port (**the frontend expects 8089**) |
| `MONGODB_URI` | `mongodb://localhost:27017/cloud4saya_db` | connection string; **required** for `dev`/`prod` |
| `MONGODB_DATABASE` | `cloud4saya_db` | database name |
| `JWT_SECRET` | dev placeholder | **change for any non-local use** |
| `APP_INTERNAL_SECRET` | dev placeholder | internal service-to-service secret |
| `APP_BASE_URL` | `http://localhost:4200` | used in emails & cookies |
| `COOKIE_DOMAIN` / `COOKIE_SECURE` | `localhost` / `false` | refresh-token cookie |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM` | Gmail SMTP / empty | outbound email; if unset, emails are logged to the console |
| `GEMINI_API_KEY` | empty | enables AI features; without it they return a disabled response |

> **No secrets are committed.** The previous hard-coded MongoDB Atlas string,
> Gemini API key and Gmail credentials were removed and replaced with the
> variables above. If you forked an older revision, rotate those credentials.

---

## Running the app

### Everything at once (root scripts)

```bash
npm install            # installs "concurrently" for the dev script
npm run dev            # starts backend + frontend together
```

> On **Linux/macOS** use `make dev` (the npm script calls the Windows `mvnw`;
> the Makefile calls `./mvnw`).

### Separately

**Backend** — `http://localhost:8089`
```bash
cd backend
./mvnw spring-boot:run          # Windows: mvnw spring-boot:run
```

**Frontend** — `http://localhost:4200`
```bash
cd frontend
npm install
npm start
```

The frontend calls the backend directly at `http://localhost:8089` (CORS is open
in dev), so **start the backend first** or reload once it is up.

---

## Demo data

A fresh database is empty. To populate every module with realistic demo data
(2 organisations, buildings, apartments, residents & staff, leases, 6 months of
charges/expenses, maintenance requests & tasks, community events, announcements,
incidents, plus the solar/gamification demo) so the dashboards are not empty:

```bash
# 1. backend + MongoDB running (see above)
# 2. optional — start local stubs so the "report incident" flow works offline
npm run mock:ai          # AI severity :3001, audio :8000, SMTP sink :1025

# 3. seed
npm run seed:demo
```

`seed:demo` only talks to the public REST API, is safe to re-run (it detects the
demo organisations and skips them), and prints the demo logins at the end:

| Role | Email | Password |
|---|---|---|
| Platform admin | `admin1@syndiqa.com` | `password123` |
| Syndic admin — Résidence El Manar (Tunis) | `admin@elmanar.demo` | `Syndic123!` |
| Syndic admin — Carthage Résidences (Sousse) | `admin@carthage.demo` | `Syndic123!` |
| Resident | `<first>.<last>0@residenceelmanar.demo` (shown by the seeder) | `Resident123!` |
| Technician | `tech.<last>0@residenceelmanar.demo` | `Staff123!` |

> The incident-reporting flow calls an external severity service on `:3001`.
> `npm run mock:ai` provides local stubs for it (and for the audio service and
> outbound mail); the `local` profile already points mail at the `:1025` sink.
> Every other module works without any stub.

---

## Ports & URLs

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:4200 | Angular dev server / nginx in Docker |
| Backend API | http://localhost:8089 | REST + `/uploads/**` static files |
| MongoDB | mongodb://localhost:27017 | database `cloud4saya_db` |
| Audio AI *(optional)* | http://127.0.0.1:8000 | see below |
| Prediction *(optional)* | http://127.0.0.1:3001 | see below |
| Payments *(optional, external)* | http://localhost:8092 | not part of this repo |

---

## Optional AI services

These power a few advanced screens; the core app runs fine without them.

- **Google Gemini** — set `GEMINI_API_KEY`. Used by building/inspection vision
  analysis, bill OCR, maintenance photo comparison and announcement drafting.
- **Audio classifier** (`backend/src/main/java/tn/esprit/pidev/services/IncidentAlert/aiServices/`)
  — a small Python/YAMNet service for incident audio:
  ```bash
  cd backend/src/main/java/tn/esprit/pidev/services/IncidentAlert/aiServices
  pip install -r requirements.txt
  python local_ai_server.py            # serves :8000
  ```
- **Prediction service** on `:3001` — external Node service that scores incident
  severity. The "report incident" flow calls it synchronously.

For local development / demos, `npm run mock:ai` (`scripts/mock-ai.mjs`) provides
lightweight stubs for the `:3001` and `:8000` services **and** an SMTP sink on
`:1025`, so the full incident flow works with no external dependency.

---

## Testing

```bash
# Backend (JUnit 5)
cd backend && ./mvnw test

# Frontend (Karma/Jasmine, headless Chrome required)
cd frontend && npm test
```

---

## Production build

```bash
# Backend -> backend/target/pidev-0.0.1-SNAPSHOT.jar
cd backend && ./mvnw clean package

# Frontend -> frontend/dist/syndiqa-ng/browser/
cd frontend && npm run build
```

Or build both container images: `docker compose build`.
For production set `SPRING_PROFILES_ACTIVE=prod` and provide `MONGODB_URI`,
`JWT_SECRET`, `APP_INTERNAL_SECRET`, mail credentials and `COOKIE_SECURE=true`.

---

## Contributing

- **Branches:** feature branches off `dev`, PRs into `dev`.
- **Backend package convention:** `tn.esprit.pidev.<layer>.<domain>`.
- **Frontend:** standalone components, feature folders under `src/app/pages` /
  `src/app/features`; shared code in `src/app/core`.
- **Style:** `.editorconfig` at the repo root — 4-space indent (2 for
  YAML/JSON/XML/properties), LF line endings. Frontend also ships Prettier +
  ESLint (`npm run format`, `npm run lint` inside `frontend/`).
- Run `./mvnw test` and `npm test` before opening a PR.
