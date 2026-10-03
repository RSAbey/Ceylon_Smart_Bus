# API contract — Member 04 (Home, notifications, delays, announcements, dashboard)

Source: `docs/PROJECT_PLAN.md` §3.4. Envelope: `{ success, message, data }` / `{ success: false, message, errors }`.
All endpoints need `Authorization: Bearer <JWT>`. Status: `planned` → `in progress` → `done` (update as you build).

> Mount note: the foundation mounts the dashboard router at `/api/admin/dashboard` (see `server/src/routeRegistry.js`).
> PROJECT_PLAN §3.4 wrote `/api/admin/stats/...`; the paths below use the mounted prefix.

## Home (`/api/home`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/home/passenger?lat=&lng=` | passenger | Nearby buses, saved routes, recent activity | planned |
| GET | `/api/home/driver` | driver | Assigned bus, active trip, next stop, today's verified count, active delay | planned |

## Recent searches (`/api/recent-searches`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/recent-searches` | passenger | Save a search | planned |
| GET | `/api/recent-searches` | passenger | List my recent searches | planned |
| DELETE | `/api/recent-searches/:id` | passenger | Remove one search | planned |
| DELETE | `/api/recent-searches` | passenger | Clear all my searches | planned |

## Notifications (`/api/notifications`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/notifications` | passenger | List (filter `type`, `isRead`, paging) | planned |
| GET | `/api/notifications/unread-count` | passenger | Unread badge count | planned |
| PATCH | `/api/notifications/:id/read` | passenger | Mark one as read | planned |
| PATCH | `/api/notifications/read-all` | passenger | Mark all as read | planned |
| DELETE | `/api/notifications/:id` | passenger | Dismiss one | planned |
| DELETE | `/api/notifications` | passenger | Clear read notifications | planned |

## Alert subscriptions (`/api/alert-subscriptions`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/alert-subscriptions` | passenger | Subscribe to a route's alerts | planned |
| GET | `/api/alert-subscriptions` | passenger | List my subscriptions | planned |
| PATCH | `/api/alert-subscriptions/:id` | passenger | Change alert type / active flag | planned |
| DELETE | `/api/alert-subscriptions/:id` | passenger | Unsubscribe | planned |

## Delays — driver (`/api/delays`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/delays` | driver | Create delay report on the ongoing trip | planned |
| GET | `/api/delays/mine` | driver | My report history | planned |
| GET | `/api/delays/active` | driver | Active delay banner | planned |
| PATCH | `/api/delays/:id` | driver | Update minutes / reason | planned |
| PATCH | `/api/delays/:id/resolve` | driver | Resolve ("back on time") | planned |
| DELETE | `/api/delays/:id` | driver | Cancel (soft delete → `cancelled`) | planned |

## Delays — admin (`/api/admin/delays`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/delays` | admin | Delay table | planned |
| PATCH | `/api/admin/delays/:id` | admin | Acknowledge / admin note / resolve | planned |

## Announcements (`/api/admin/announcements`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/admin/announcements` | admin | Create (draft) | planned |
| GET | `/api/admin/announcements` | admin | List | planned |
| PATCH | `/api/admin/announcements/:id` | admin | Edit / archive | planned |
| PATCH | `/api/admin/announcements/:id/publish` | admin | Publish + notify recipients | planned |
| DELETE | `/api/admin/announcements/:id` | admin | Delete draft/archived | planned |

## Dashboard (`/api/admin/dashboard`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/dashboard/overview` | admin | KPI cards | planned |
| GET | `/api/admin/dashboard/performance` | admin | Chart series | planned |

## Shared service (not HTTP)
`notificationService.createNotification({ recipientUserIds, type, title, message, related })` → number inserted. **Done in foundation.**
`delayService.getActiveDelayMinutes(tripId)` → minutes of the active delay or 0. **Done in foundation.**
