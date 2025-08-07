# Project Configuration & Dev Guide

## Tech Stack

| Layer     | Lib / Service     | Version  |
| --------- | ----------------- | -------- |
| Frontend  | React             | 18.x     |
| Bundler   | Vite              | 5.x      |
| State     | Redux Toolkit     | 2.x      |
| Backend   | NestJS            | 10.x     |
| Runtime   | Node              | 20 LTS   |
| DB        | PostgreSQL        | 16       |
| Queue     | Azure Service Bus | 1.x SDK  |
| Blob      | Azure Storage     | 12.x SDK |
| Auth      | Azure AD B2C      | —        |
| Test      | Vitest / Jest     | latest   |
| CI        | GitHub Actions    | —        |
| Container | Docker            | 24.x     |

## Local Dev

1. `pnpm install`
2. `docker compose up db`
3. `pnpm run dev` (starts Vite + Nest concurrently)
4. Visit [http://localhost:5173](http://localhost:5173)

## Folder Structure

```
/
 ├─ apps/
 │   ├─ api/          # NestJS
 │   └─ web/          # React PWA
 ├─ packages/
 │   └─ shared/       # ts-models, utils
 ├─ infra/            # Bicep/ARM
 ├─ .github/workflows/
 └─ docker-compose.yml
```

## Testing

| Type        | Tool      | Command               |
| ----------- | --------- | --------------------- |
| Unit (FE)   | Vitest    | `pnpm test`           |
| Unit (BE)   | Jest      | `pnpm test:api`       |
| Integration | Supertest | part of backend suite |
| E2E         | Cypress   | `pnpm cypress:run`    |

CI runs all tests + Lighthouse + bundlesize.

## Git Workflow

* `main` = prod
* `dev` = staging
* feature branches → PR → checks → squash merge
* Tags `vX.Y.Z` trigger prod deploy

## CI/CD

* PR: lint, unit, integration, Cypress headless
* Merge → dev: deploy to **staging slot**
* Manual approval → slot swap to prod
* Artifacts: Docker images pushed to ACR

## Monitoring

* **App Insights** auto-collect
* Custom metrics: `scenario_compute_time`, `xlsx_parse_time`
* Alerts: Slack webhook & email

## Logging

* Winston JSON log format
* Trace context propagated via `@nestjs/terminus`

## Security Best Practices

* Helmet middleware, CSP strict-dynamic
* Rate-limit auth routes (express-rate-limit)
* SHA-256 password hashes (argon2id)
* Dependabot weekly

## Performance Guidelines

* Avoid blocking XLSX parse on main thread—offload to Function
* Use IndexedDB for offline drafts, debounce sync
* DB indices: `scenarios.project_id`, `projects.name`