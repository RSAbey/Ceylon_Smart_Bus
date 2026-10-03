# Repository Structure v2 (aligned to the EER) — `ceylon-smart-bus`

One GitHub monorepo: **mobile app + API + admin dashboard + docs**. Vercel deploys `admin/` and `server/` as two projects; EAS builds the APK from `mobile/`.
The Claude Code prompt that creates all of this is `repo-bootstrap/CLAUDE_CODE_BOOTSTRAP_PROMPT.md`.

## What changed from v1 because of the EER

| Change | Why (EER reason) |
|---|---|
| **20 model files, one per ERD table**, each inside its owner's module | The relational diagram is the contract; model files mirror it 1:1 |
| New modules `savedRoutes` (M02) and `alertSubscriptions` (M04) | They are the tables created from the two M:N relationships (PASSENGER–ROUTE) |
| `otpVerification.model.js` inside `auth/`, `routeStop.model.js` inside `routes/`, `busLocation.model.js` inside `tracking/`, `inquiryReply.model.js` inside `inquiries/` | Weak/dependent entities live with their parent |
| `drivers/` module has only `driverProfile.model.js` + admin routes | Specialisation: `USER.role` + a `DriverProfile` table only for drivers |
| Enums in `<module>.constants.js`, not one global file | A single shared enum file would be edited by all four members (merge conflicts) |
| `routeRegistry.js` mounts all 26 routers up front; admin APIs under `/api/admin/*` | Nobody edits shared server files later |
| Per-member files for API contract, test cases, evidence | Four people never edit the same markdown/binary file |
| `tooling/banned-identifiers.json` + ESLint `id-denylist` | Enforces "no generic variable names" automatically instead of by review |
| `payments/` module added (mock gateway) and mobile `payments` feature | ERD has PAYMENT; admin finance dashboard reads it (`/api/admin/finance`) |
| Drawer menu limited to Home, Explore, Live Tracking, My Tickets, Alerts, Help & Support | Figma drawer also shows Travel History and Settings, but no member owns them in Milestone 03 |

## Full tree

```
ceylon-smart-bus/
├── CLAUDE.md                              # rules Claude Code reads automatically in every session
├── README.md                              # setup, run, deploy, APK + admin URLs (examiner reads first)
├── package.json                           # root helper scripts only (install:all, lint:all, dev:server, dev:admin, dev:mobile)
├── .gitignore  .editorconfig  .prettierrc.json  .nvmrc
├── .github/
│   ├── CODEOWNERS
│   ├── pull_request_template.md
│   └── workflows/ci.yml                   # install + lint (+ admin build) on every pull request
├── tooling/
│   └── banned-identifiers.json            # ONE list of banned generic names, read by all three ESLint configs
│
├── docs/
│   ├── PROJECT_PLAN.md  DEVELOPER_GUIDE.md  MASTER_PROMPTS.md  REPO_STRUCTURE.md
│   ├── ERD_AND_RELATIONAL.md  TRELLO_BOARD.md
│   ├── design/                            # design overview PNGs + token docs (single source of truth)
│   │   ├── color-palette.png  typography-scale.png  Button_Components.png
│   │   ├── Ceylon_Smart_Bus___Navigation_Components.png  logo_1.png  app_icon_1.png
│   │   ├── DESIGN_TOKENS.md               # every colour / type / spacing value used by mobile + admin
│   │   └── DESIGN_DEVIATIONS.md           # where the design PNGs disagree with each other, and what we chose
│   ├── diagrams/                          # EER + relational (png, svg, pdf, drawio)
│   ├── api/                               # one contract file per member (no merge conflicts)
│   │   ├── m01-accounts.md  m02-routes-tracking.md  m03-tickets-inquiries.md  m04-operations.md
│   ├── testing/
│   │   ├── functional/                    # one markdown test-case table per member
│   │   │   ├── m01-accounts.md  m02-routes-tracking.md  m03-tickets-inquiries.md  m04-operations.md
│   │   ├── traceability-matrix.md         # requirement -> prototype -> implementation -> test case
│   │   └── usability/
│   │       ├── usability-test-plan.md
│   │       └── usability-session-log.md
│   ├── evidence/                          # Figma-vs-app screenshots + deviation log, per member
│   │   ├── m01/  m02/  m03/  m04/         # each: README.md, deviations.md, screenshots/.gitkeep
│   └── report/
│       └── REPORT_OUTLINE.md              # section checklist from the Milestone 03 brief
│
├── server/                                # Node + Express API  (Vercel project 1, Root Directory = server)
│   ├── package.json  eslint.config.js  vercel.json  .env.example
│   ├── api/index.js                       # Vercel entry: exports the Express app
│   └── src/
│       ├── app.js  server.js  routeRegistry.js     # routeRegistry.js mounts EVERY router (nobody edits it again)
│       ├── config/        database.js  environment.js
│       ├── middleware/    authenticateToken.js  authorizeRoles.js  validateRequest.js  handleErrors.js  handleNotFound.js
│       ├── utils/         asyncHandler.js  sendResponse.js  AppError.js
│       ├── seed/
│       │   ├── seedDatabase.js            # orchestrator:  npm run seed
│       │   └── data/      m01Accounts.js  m02Fleet.js  m03Tickets.js  m04Operations.js
│       └── modules/                       # one folder per module; model files mirror the ERD tables 1:1
│           ├── auth/               auth.routes.js  auth.controller.js  auth.service.js  auth.validation.js  otpVerification.model.js          [M01]
│           ├── users/              user.model.js  user.routes.js  user.admin.routes.js  user.controller.js  user.service.js  user.constants.js   [M01]
│           ├── drivers/            driverProfile.model.js  driver.admin.routes.js                                                                [M01]
│           ├── routes/             route.model.js  routeStop.model.js  route.routes.js  route.admin.routes.js  route.constants.js               [M02]
│           ├── buses/              bus.model.js  bus.admin.routes.js  bus.constants.js                                                           [M02]
│           ├── trips/              trip.model.js  trip.routes.js  trip.service.js  trip.constants.js                                             [M02]
│           ├── tracking/           busLocation.model.js  tracking.routes.js  tracking.admin.routes.js                                            [M02]
│           ├── savedRoutes/        savedRoute.model.js  savedRoute.routes.js  savedRoute.service.js                                              [M02]
│           ├── tickets/            ticket.model.js  ticket.routes.js  ticket.service.js  ticket.constants.js                                     [M03]
│           ├── seats/              seatBooking.model.js  seat.routes.js  seat.constants.js                                                       [M03]
│           ├── payments/           payment.model.js  payment.routes.js  payment.admin.routes.js  payment.constants.js                            [M03]
│           ├── verification/       ticketVerification.model.js  verification.routes.js  verification.constants.js                                [M03]
│           ├── inquiries/          inquiry.model.js  inquiryReply.model.js  inquiry.routes.js  inquiry.admin.routes.js  inquiry.constants.js     [M03]
│           ├── home/               home.routes.js                                                                                                [M04]
│           ├── notifications/      notification.model.js  notification.routes.js  notification.service.js  notification.constants.js            [M04]
│           ├── alertSubscriptions/ alertSubscription.model.js  alertSubscription.routes.js  alertSubscription.constants.js                       [M04]
│           ├── delays/             delayReport.model.js  delay.routes.js  delay.admin.routes.js  delay.service.js  delay.constants.js            [M04]
│           ├── announcements/      announcement.model.js  announcement.admin.routes.js  announcement.constants.js                                [M04]
│           ├── recentSearches/     recentSearch.model.js  recentSearch.routes.js                                                                 [M04]
│           └── dashboard/          dashboard.admin.routes.js                                                                                     [M04]
│
├── mobile/                                # React Native (Expo) — passenger + driver in ONE app
│   ├── package.json  app.config.js  eas.json  eslint.config.js  .env.example
│   ├── assets/images/                     # icon.png  adaptive-icon.png  splash.png  logo.png (from docs/design)
│   ├── app/                               # Expo Router. THIN files only: each re-exports a screen from src/features
│   │   ├── _layout.js                     # fonts, providers (Auth, Toast), auth redirect
│   │   ├── index.js                       # redirects by role
│   │   ├── (auth)/                        # _layout.js  login.js  register.js  otp.js                                         [M01]
│   │   ├── (passenger)/
│   │   │   ├── _layout.js                 # Stack + DrawerMenu host
│   │   │   ├── (tabs)/                    # _layout.js (bottom nav)  home.js [M04]  explore.js [M02]  tickets.js [M03]  alerts.js [M04]  profile.js [M01]
│   │   │   ├── route-details/[routeId].js                       [M02]
│   │   │   ├── saved-routes.js                                  [M02]
│   │   │   ├── live-tracking/index.js  live-tracking/[tripId].js [M02]
│   │   │   ├── seat-selection/[tripId].js                       [M03]
│   │   │   ├── payment/[ticketId].js                            [M03]
│   │   │   ├── ticket/new.js  ticket/[ticketId].js  ticket/edit/[ticketId].js   [M03]
│   │   │   ├── inquiries/index.js  new.js  [inquiryId].js  edit/[inquiryId].js  [M03]
│   │   │   ├── alert-settings.js                                [M04]
│   │   │   └── edit-profile.js                                  [M01]
│   │   └── (driver)/
│   │       ├── _layout.js
│   │       ├── (tabs)/                    # _layout.js  dashboard.js [M04]  trip.js [M02]  verify-ticket.js [M03]  delay-report.js [M04]  profile.js [M01]
│   │       ├── delay-history.js                                 [M04]
│   │       └── inquiries/index.js  new.js  [inquiryId].js  edit/[inquiryId].js  [M03]
│   └── src/
│       ├── theme/                         # colors.js  typography.js  spacing.js  index.js            (from docs/design PNGs)
│       ├── components/                    # SHARED design system — owner Member 04
│       │   ├── navigation/                AppHeader.js  BottomTabBar.js  DrawerMenu.js  DrawerContext.js  drawerMenuItems.js
│       │   ├── ui/                        AppButton.js  AppTextInput.js  AppCard.js  StatusBadge.js  ConfirmDialog.js  ToastMessage.js  ScreenContainer.js
│       │   └── feedback/                  LoadingState.js  EmptyState.js  ErrorState.js  UnderDevelopmentScreen.js
│       ├── services/apiClient.js          # axios + JWT interceptor + error normaliser
│       ├── context/AuthContext.js         # session restore, signIn, signOut, role
│       ├── hooks/                         usePolling.js  useDebouncedValue.js
│       ├── utils/                         constants.js  tokenStorage.js
│       └── features/                      # ONE FOLDER PER FEATURE; each has screens/ + constants.js; components/ services/ hooks/ hold .gitkeep
│           ├── auth/ (LoginScreen RegisterScreen OtpScreen)                                   [M01]
│           ├── profile/ (ProfileScreen EditProfileScreen)                                     [M01]
│           ├── routes/ (ExploreRoutesScreen RouteDetailsScreen SavedRoutesScreen)             [M02]
│           ├── tracking/ (SelectBusToTrackScreen LiveTrackingScreen DriverTripScreen)         [M02]
│           ├── tickets/ (MyTicketsScreen CreateTicketScreen TicketDetailsScreen EditTicketScreen)  [M03]
│           ├── seats/ (SeatSelectionScreen)                                                   [M03]
│           ├── payments/ (PaymentScreen)                                                      [M03]
│           ├── verification/ (VerifyTicketScreen)                                             [M03]
│           ├── inquiries/ (InquiriesListScreen InquiryFormScreen InquiryDetailsScreen)        [M03]
│           ├── home/ (PassengerHomeScreen DriverHomeScreen)  hooks/useUnreadNotificationCount.js   [M04]
│           ├── notifications/ (NotificationsScreen AlertSettingsScreen)                       [M04]
│           └── delay-reporting/ (DelayReportScreen DelayHistoryScreen)                        [M04]
│
└── admin/                                 # React + Vite dashboard  (Vercel project 2, Root Directory = admin)
    ├── package.json  eslint.config.js  vite.config.js  vercel.json  index.html  .env.example
    ├── public/                            # favicon + logo from docs/design
    └── src/
        ├── main.jsx  App.jsx              # App.jsx holds the router: every page already routed
        ├── theme/tokens.css  global.css   # CSS variables mirroring mobile theme
        ├── config/navigationItems.js      # THE sidebar menu list
        ├── components/
        │   ├── layout/   AdminLayout.jsx  Sidebar.jsx  TopBar.jsx  PageHeader.jsx
        │   └── ui/       Button.jsx  StatCard.jsx  DataTable.jsx  StatusBadge.jsx  Modal.jsx  ConfirmDialog.jsx  EmptyState.jsx  ErrorState.jsx  Toast.jsx  UnderDevelopmentPage.jsx
        ├── services/apiClient.js
        ├── context/AuthContext.jsx
        ├── routes/ProtectedRoute.jsx
        └── pages/
            ├── auth/          LoginPage.jsx                                  [M01]
            ├── drivers/       DriversPage.jsx                                [M01]
            ├── routes/        RoutesPage.jsx                                 [M02]
            ├── buses/         BusesPage.jsx                                  [M02]
            ├── fleet/         LiveFleetPage.jsx                              [M02]
            ├── finance/       FinancePage.jsx                                [M03]
            ├── inquiries/     InquiriesPage.jsx                              [M03]
            ├── overview/      OverviewPage.jsx                               [M04]
            ├── delays/        DelaysPage.jsx                                 [M04]
            ├── announcements/ AnnouncementsPage.jsx                          [M04]
            └── performance/   PerformancePage.jsx                            [M04]
```

## ERD table → model file → owner

| ERD table | Model file | Module | Owner |
|---|---|---|---|
| USER | `user.model.js` | users | M01 |
| DRIVER_PROFILE | `driverProfile.model.js` | drivers | M01 |
| OTP_VERIFICATION | `otpVerification.model.js` | auth | M01 |
| ROUTE | `route.model.js` | routes | M02 |
| ROUTE_STOP | `routeStop.model.js` | routes | M02 |
| BUS | `bus.model.js` | buses | M02 |
| TRIP | `trip.model.js` | trips | M02 |
| BUS_LOCATION | `busLocation.model.js` | tracking | M02 |
| SAVED_ROUTE | `savedRoute.model.js` | savedRoutes | M02 |
| TICKET | `ticket.model.js` | tickets | M03 |
| SEAT_BOOKING | `seatBooking.model.js` | seats | M03 |
| PAYMENT | `payment.model.js` | payments | M03 |
| TICKET_VERIFICATION | `ticketVerification.model.js` | verification | M03 |
| INQUIRY | `inquiry.model.js` | inquiries | M03 |
| INQUIRY_REPLY | `inquiryReply.model.js` | inquiries | M03 |
| RECENT_SEARCH | `recentSearch.model.js` | recentSearches | M04 |
| NOTIFICATION | `notification.model.js` | notifications | M04 |
| ALERT_SUBSCRIPTION | `alertSubscription.model.js` | alertSubscriptions | M04 |
| DELAY_REPORT | `delayReport.model.js` | delays | M04 |
| ANNOUNCEMENT | `announcement.model.js` | announcements | M04 |

## API mount points (all registered in `server/src/routeRegistry.js`)

| Passenger / driver | Admin only (`authorizeRoles('admin')`) |
|---|---|
| `/api/auth` `/api/users` `/api/routes` `/api/saved-routes` `/api/trips` `/api/tracking` | `/api/admin/users` `/api/admin/drivers` `/api/admin/routes` `/api/admin/buses` `/api/admin/fleet` |
| `/api/tickets` `/api/seats` `/api/payments` `/api/verification` `/api/inquiries` | `/api/admin/finance` `/api/admin/inquiries` |
| `/api/home` `/api/notifications` `/api/alert-subscriptions` `/api/delays` `/api/recent-searches` | `/api/admin/delays` `/api/admin/announcements` `/api/admin/dashboard` |

## Why this structure prevents merge conflicts
1. **Feature folders** — each member works almost only in `features/<name>`, `modules/<name>`, `pages/<name>`.
2. **Thin route files** — every file in `mobile/app/` is a one-line re-export; the foundation commit creates all of them, so navigation files are never edited again.
3. **Pre-registered everything** — API routers, admin router, admin sidebar items, mobile tab layouts.
4. **Shared folders** (`components`, `theme`, `services/apiClient.js`, middleware) belong to one owner; others propose changes via PR.
5. **Per-member docs** — `docs/api`, `docs/testing/functional`, `docs/evidence` are split by member.

## Branching
```
main      <- protected; release only (APK + deployed admin come from here)
develop   <- integration; every PR targets it
 |- feature/m00-foundation          (bootstrap — merge first)
 |- feature/m01-accounts
 |- feature/m02-routes-tracking
 |- feature/m03-tickets-inquiries
 `- feature/m04-notifications-ops
```
Commit small (`feat(notifications): ...`), merge `origin/develop` into your branch each morning, PR into `develop` with the template ticked, release by merging `develop` -> `main` and tagging `v1.0.0` with the APK attached.

## Deployment map

| Part | Where | How |
|---|---|---|
| Admin dashboard | Vercel project 1, Root Directory `admin` | Framework Vite; env `VITE_API_URL=https://<api-project>.vercel.app/api` |
| API | Vercel project 2, Root Directory `server` | env `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGINS` (admin URL) |
| Database | MongoDB Atlas M0 | Network Access `0.0.0.0/0` (Vercel IPs are dynamic) |
| APK | EAS Build | `cd mobile && eas build -p android --profile preview` (API URL in `eas.json`, Google Maps key as an EAS secret) → attach to GitHub Release |

> **Google Maps key:** react-native-maps on Android needs a Google Maps SDK key inside the built APK, otherwise the live-tracking map is blank. Member 02 must create one (free tier, needs a billing account on file) before the first APK build, or choose a no-key alternative such as a Leaflet map inside a WebView.
> Never commit `.env` files, the Atlas password, the JWT secret or the Maps key.
