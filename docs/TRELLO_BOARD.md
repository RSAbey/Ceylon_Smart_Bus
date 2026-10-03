# Trello Board — "WE-133 Ceylon Smart Bus · Milestone 03"

Simple Kanban. Deadline **09.10.2026**; feature freeze **06.10.2026**.

## Lists (left → right)
1. **📌 Info & Rules** (pinned cards: repo link, Figma link, Vercel URLs, naming rules, deadline)
2. **Backlog**
3. **This Day** (cards you will finish today)
4. **In Progress**
5. **In Review (PR open)**
6. **Testing**
7. **Done**

## Labels
| Label | Colour |
|---|---|
| Member 01 | Blue |
| Member 02 | Green |
| Member 03 | Orange |
| Member 04 | Purple |
| Shared / All | Black |
| Bug | Red |
| Report | Yellow |
| Blocked | Pink |

Card rule: **one card = one vertical slice** (API + screen + admin page), with a checklist. Add a due date to every card.

## Cards (copy into Backlog)

### Shared / All
| Card | Due | Checklist |
|---|---|---|
| Team decisions: stack, ERD, branches, deviations | 03.10 | ☐ stack agreed ☐ ERD approved ☐ Inquiry tag list ☐ mock payment agreed ☐ deviation list |
| GitHub repo + branches + CODEOWNERS + PR template | 03.10 | ☐ repo created ☐ 4 member branches ☐ `develop` ☐ protect `main` ☐ README skeleton |
| MongoDB Atlas + env variables shared (securely) | 03.10 | ☐ cluster ☐ DB user ☐ `.env.example` ☐ each member `.env` |
| Seed script (users, routes, buses, trips) | 04.10 | ☐ passenger ☐ driver ☐ admin ☐ 2 routes ☐ 3 buses ☐ 1 ongoing trip |
| Deploy API + admin to Vercel | 06.10 | ☐ API project ☐ admin project ☐ CORS ☐ env vars ☐ smoke test |
| EAS preview APK build #1 | 05.10 | ☐ expo account ☐ eas.json ☐ build ☐ install on phone |
| Final APK + GitHub Release v1.0.0 | 08.10 | ☐ final build ☐ release notes ☐ link in README |
| FEATURE FREEZE | 06.10 | ☐ all PRs merged ☐ only bug fixes after this |

### Member 01 — Accounts
| Card | Checklist |
|---|---|
| Auth API (register, login, JWT, roles) | ☐ model ☐ bcrypt ☐ endpoints ☐ role middleware |
| Passenger register + OTP + login screens | ☐ validation ☐ OTP resend ☐ error states ☐ Figma match |
| Profile view/edit | ☐ view ☐ edit ☐ logout ☐ change password |
| Admin: register drivers + driver list | ☐ form ☐ table ☐ edit/block ☐ delete |
| Admin login page + protected routes | ☐ login ☐ ProtectedRoute |

### Member 02 — Route & Tracking
| Card | Checklist |
|---|---|
| Route CRUD + stops (admin) | ☐ create ☐ list ☐ edit ☐ delete |
| Bus registration + driver assignment + route assignment (admin) | ☐ bus CRUD ☐ assign driver ☐ assign route |
| Driver Start/End Trip + location posting | ☐ start ☐ post location 5 s ☐ end |
| Route search + details + saved routes | ☐ search ☐ details ☐ save/remove |
| Live tracking + ETA + nearest bus | ☐ map ☐ polling ☐ ETA ☐ delay adjust hook (needs M04) |
| Admin live fleet map | ☐ markers ☐ status colours |

### Member 03 — Tickets, Seats & Inquiries
| Card | Checklist |
|---|---|
| Ticket create/update/cancel + seat selection | ☐ create ☐ choose seat ☐ update ☐ cancel releases seat |
| My Tickets + QR + offline cache | ☐ list ☐ QR ☐ offline view |
| Driver verification (QR scan + ticket key) | ☐ scan ☐ key search ☐ valid/invalid |
| Admin finance monitor | ☐ revenue summary ☐ transactions table ☐ filters |
| Inquiries (passenger + driver) | ☐ create ☐ view ☐ edit ≤5 min ☐ delete ≤5 min ☐ priority ☐ tag ☐ link route/bus/driver |
| Admin inquiry inbox | ☐ list+filter ☐ reply ☐ close |

### Member 04 — Notifications, Delay, Home, Admin overview
| Card | Due | Checklist |
|---|---|---|
| **Foundation: theme + shared components + nav shell** | 03.10 | ☐ tokens ☐ AppHeader ☐ BottomTabBar ☐ DrawerMenu ☐ AppButton states ☐ AdminLayout+Sidebar ☐ stub routes for all members |
| notificationService (shared) | 04.10 | ☐ createNotification ☐ notifyRouteSubscribers |
| Notifications screen (Variant B cards) | 05.10 | ☐ list+filter ☐ mark read ☐ dismiss ☐ unread badge ☐ empty/loading/error ☐ delay → live tracking |
| Alert settings (subscribe/unsubscribe) | 05.10 | ☐ create ☐ update type ☐ delete |
| Driver Delay Reporting (Variant C) | 05.10 | ☐ create ☐ history ☐ update ☐ resolve ☐ cancel ☐ ETA hook ☐ notify |
| Admin Delays page | 05.10 | ☐ table ☐ acknowledge ☐ note ☐ resolve |
| Admin Announcements CRUD + publish | 05.10 | ☐ create ☐ edit ☐ publish ☐ delete ☐ fan-out |
| Admin Overview (stats first) + Performance | 06.10 | ☐ KPI cards ☐ 2 charts ☐ loading/error |
| Home passenger + recent searches | 06.10 | ☐ search ☐ save recent ☐ delete recent ☐ nearby buses ☐ saved shortcuts ☐ recent activity |
| Driver Home | 06.10 | ☐ assigned bus ☐ active trip ☐ quick actions |
| Design fidelity pass (Figma vs app screenshots) | 07.10 | ☐ all M04 screens ☐ deviation log |

### Testing & Report
| Card | Due | Checklist |
|---|---|---|
| Functional test cases (all members) | 05.10 | ☐ template ☐ each member writes theirs ☐ traceability matrix |
| Execute functional tests | 07.10 | ☐ run on APK ☐ pass/fail ☐ screenshots |
| Usability test plan | 05.10 | ☐ 5+ participants ☐ 5 tasks ☐ metrics ☐ consent to record |
| Usability sessions | 07.10 | ☐ 5+ recordings ☐ log issues H/M/L |
| Fix top usability/defect issues | 08.10 | ☐ fix ☐ before/after screenshot |
| Report — M1/M2 summaries, stack, architecture | 07.10 | ☐ drafted |
| Report — implementation, tests, usability, conclusion, Gantt | 08.10 | ☐ drafted ☐ AI check < 50% ☐ ≤35 pages ☐ appendix |
| Viva rehearsal | 08.10 | ☐ each member demos own part ☐ explain stack |
| SUBMIT PDF `IT3060HCI2026_Milestone03_Group<no>` | 09.10 | ☐ repo link ☐ APK link ☐ admin URL |

## Import option
Trello cannot import this Markdown directly. Either create manually (about 20 min), or ask me and I will build the board for you through the Trello connector.
