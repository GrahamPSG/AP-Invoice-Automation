# Test-Driven Implementation Plan

## Conventions

* **Path style:** `/src/module/...`
* **Test runner:** Vitest (frontend) & Jest (backend)
* **Commit rule:** Red → Green → Refactor per task

### 50 Granular Tasks

1. **Boot repo** – `pnpm init`, commit ✓
2. Configure **ESLint + Prettier**
3. Add **Vitest + jest** configs
4. Scaffold **NestJS** app (`nest new api`)
5. Write failing test: unauthenticated `/projects` returns 401
6. Implement **AuthGuard** → pass test
7. Add **User entity**, migrations with TypeORM
8. Test: user registration returns 201
9. 🟢 Implement `/auth/register`
10. Test: login returns JWT
11. 🟢 Implement `/auth/login`
12. Front-end Vite React boot; basic router
13. Add Cypress e2e skeleton
14. Test: PWA manifest served
15. Implement Workbox service-worker & offline route
16. Upload component skeleton; failing unit test for "select file"
17. Parse XLSX in browser (SheetJS) preview table
18. Backend: file upload presigned SAS test
19. Implement Azure Blob adapter
20. Column map screen – test mapping saved
21. API: `POST /projects` stores metadata
22. Function: ParseJob – failing integration test
23. Implement ParseJob (xlsx → DB)
24. Scenario form UI with React Hook Form
25. Compute engine unit test: gp % calc
26. Compute engine module passes test
27. `POST /scenarios` integration test – returns outputs
28. React: ScenarioList page; test renders list
29. RoleGuard test: viewer cannot POST
30. Export PDF – test file generated in temp dir
31. Implement Puppeteer PDF export
32. Export XLSX – SheetJS writer
33. Alerts engine unit test: overhead threshold triggers
34. Background Function for alerts – integration test with SendGrid mock
35. Twilio SMS test via nock
36. Add `viewer`/`editor` role toggles UI
37. Redux Toolkit query hooks tests
38. PWA offline scenario creation test
39. Performance budget test (bundle size) via bundlesize
40. GitHub Action: lint + test + build
41. Dockerfile build step test passes
42. docker-compose integration test (local PG + API)
43. Seed script for demo data
44. Cypress: happy path – upload → map → scenario → export
45. Lighthouse CI: PWA score >= 90
46. Add Application Insights SDK – test telemetry sent
47. ARM / Bicep infra templates + smoke tests
48. Blue-green deploy GitHub Action – test slot-swap
49. Load test k6: < 2 s TTFB met
50. Final security scan with npm-audit, snyk

### Implementation Order

1. Auth → Projects upload → XLSX parsing → Scenario engine → Alerts → Exports → PWA/offline → CI/CD → Monitoring

### DB Migration Sequence

1. users
2. projects
3. cost_lines
4. scenarios
5. alerts

### Front-end Component Hierarchy

* `AppLayout`
  * `SidebarNav`
  * `RouteOutlet`
    * `ProjectUpload`
    * `ColumnMap`
    * `ScenarioForm`
    * `ScenarioList`
    * `ScenarioDetail`

### Deployment Prep

* Container image push
* Database seed
* DNS + SSL via Azure Front Door
* Post-deploy Cypress smoke run