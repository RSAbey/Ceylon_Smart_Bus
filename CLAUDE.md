# Ceylon Smart Bus — rules for Claude Code (read before every task)

University project (IT3060 HCI, group WE-133, Milestone 03). Real-time public bus tracking + digital ticketing for Sri Lanka.
One monorepo: `mobile/` (React Native + Expo Router, JavaScript) · `server/` (Node + Express + Mongoose) · `admin/` (React + Vite) · `docs/`.
Everything the team decided lives in `docs/` — read it instead of guessing: `PROJECT_PLAN.md`, `ERD_AND_RELATIONAL.md`, `DEVELOPER_GUIDE.md`, `design/`, `api/`.

## 0. Who is working? (ask first if not stated)
Ask "Which member are you (01–04)?" unless the user already said. Then edit **only that member's folders**. If a change is needed elsewhere,
say what to ask the owner (or use the shared-contract functions in §7). Never "fix" another member's file silently.

| Member | Area | Mobile `src/features/` | Server `src/modules/` | Admin `src/pages/` |
|---|---|---|---|---|
| 01 | Accounts | auth, profile | auth, users, drivers | auth, drivers |
| 02 | Routes & tracking | routes, tracking | routes, buses, trips, tracking, savedRoutes | routes, buses, fleet |
| 03 | Tickets, seats, inquiries | tickets, seats, payments, verification, inquiries | tickets, seats, payments, verification, inquiries | finance, inquiries |
| 04 | Home, notifications, delay, admin overview + **shared shell** | home, notifications, delay-reporting; `src/components`, `src/theme` | home, notifications, alertSubscriptions, delays, announcements, recentSearches, dashboard | overview, delays, announcements, performance; `components`, `theme`, `config` |

Route files in `mobile/app/` are **thin re-exports** — change them only to point at a renamed screen.
Shared folders (`mobile/src/components`, `theme`, `services`, `context`, `server/src/middleware`, `utils`, `routeRegistry.js`, `admin/src/components`) belong to Member 04 (middleware/auth to Member 01): propose changes, don't edit.

## 1. Non-negotiable code rules
1. **No generic names.** Banned identifiers are in `tooling/banned-identifiers.json` (data, temp, res, item, list, value, obj, flag, handle…). Name things for what they are: `unreadNotifications`, `submitDelayReport`, `isDelayFormSubmitting`. ESLint enforces this — never silence it with inline disables.
2. **No junk:** no unused imports/vars/props/files, no commented-out code, no `console.log`, no TODO, no lorem ipsum/test123, no copy-pasted blocks, no magic numbers/strings (use `*.constants.js`).
3. **Comments:** every file starts with a one-line purpose comment; every function has a JSDoc (what, `@param`, `@returns`); inline comments explain *why*.
4. **Layering (server):** `routes → controller → service → model`. Controllers = HTTP only; business rules in services; validate all input server-side.
5. **Frontend:** screens compose components; API calls only in `features/<name>/services`; functions < ~40 lines, one job.
6. **Student code:** simple and readable — the author must explain every line in a viva. No clever abstractions, no unnecessary libraries, no invented endpoints/fields/packages. If unsure, ask.
7. Never commit `.env` or secrets. `npm run lint` must pass before you say a task is done.

## 2. Design system (never reinvent)
- Source of truth: `docs/design/*.png` + `docs/design/DESIGN_TOKENS.md`. Mobile uses `src/theme`; admin uses `theme/tokens.css`. **No hard-coded hex colours, font sizes or spacing in screens.**
- Transit Blue primary, Action Amber/Orange secondary, semantic success/warning/error/info, font Inter. Touch targets ≥ 44 px. Never rely on colour alone (icon + text). Add `accessibilityLabel`.
- Reuse shared components (AppHeader, BottomTabBar, DrawerMenu, AppButton, AppTextInput, AppCard, StatusBadge, ConfirmDialog, ToastMessage, Loading/Empty/ErrorState; admin: AdminLayout, Sidebar, PageHeader, StatCard, DataTable, Modal, ConfirmDialog…).
- Every screen implements **loading, empty, error and success** states.
- Match the Figma screen in structure and intent; record any deviation in `docs/evidence/m0X/deviations.md`.

## 3. Data model rules (the ERD is law: `docs/ERD_AND_RELATIONAL.md`)
- ERD primary keys (`userId`, `routeId`, …) are Mongo `_id`; APIs expose them as `id`. Foreign-key fields keep the ERD names (`userId`, `routeId`, `driverId`…) with `ref`.
- Do not add, rename or remove fields/enums/indexes without telling the user — the ERD and report would go out of sync.
- Roles: `passenger | driver | admin`. Only drivers have a `DriverProfile`.

## 4. API conventions
- Success `{ "success": true, "message": "...", "data": ... }` · failure `{ "success": false, "message": "...", "errors": [...] }`.
- Mounts: passenger/driver at `/api/<module>`, admin-only at `/api/admin/<module>` (see `server/src/routeRegistry.js`). JWT in `Authorization: Bearer`.
- Document every endpoint you add in your `docs/api/m0X-*.md`.

## 5. Commands
`npm run install:all` · `npm run dev:server` (http://localhost:5000) · `npm run dev:admin` (http://localhost:5173) · `npm run dev:mobile` (Expo) ·
`npm run lint:all` · `cd server && npm run seed` (demo data; refuses to run in production).
Phone testing needs your laptop's **LAN IP** in `mobile/.env` (`EXPO_PUBLIC_API_URL=http://<ip>:5000/api`).

## 6. Git workflow
`main` (release only) ← `develop` (integration) ← `feature/m0X-<area>` (your branch). Commit small: `feat(notifications): …`, `fix(delays): …`, `docs: …`.
Merge `origin/develop` into your branch every morning. Open a PR into `develop` with the template ticked. Never push to `main`/`develop` directly.

## 7. Shared contracts (do not change a signature without telling the group)
`authenticateToken` / `authorizeRoles(...)` → `req.user = { userId, role }` · `notificationService.createNotification` (M04) ·
`delayService.getActiveDelayMinutes(tripId)` (M04) · `tripService.getOngoingTripForDriver(driverId)` (M02) ·
`ticketService.getActiveTicketHolderIds(tripId)` (M03) · `savedRouteService.getUserIdsBySavedRoute(routeId)` (M02).

## 8. Evidence & honesty (marks depend on it)
- Functional test cases go in `docs/testing/functional/m0X-*.md`. **Leave Actual/Pass-Fail empty until the test is really run.** Never invent test or usability results.
- Never claim something works unless you ran it; say plainly what you could not verify (device, Atlas, deployment).
- Report text is written by the students (AI-percentage check < 50%). Help with code, outlines and checklists; don't ghost-write report prose.
