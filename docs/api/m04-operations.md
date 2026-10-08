# API contract — Member 04 (Home, notifications, delays, announcements, dashboard)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`.
Status: `planned` → `in progress` → `done`.

## Home (`/api/home`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/home/passenger?lat=&lng=` | passenger | Everything the Home screen shows in one call: name, nearby buses, saved routes, recent searches. Location is optional. | done |
| GET | `/api/home/driver` | driver | Driver dashboard: assigned bus, route, stops, running trip and `activeDelayMinutes`. | done |

## Notifications (`/api/notifications`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/notifications` | passenger, driver | The caller's feed, newest first. `?type=`, `?isRead=` and `?page=` narrow it. Returns `notifications`, `totalCount`, `unreadCount`, `hasMore`. | done |
| GET | `/api/notifications/unread-count` | passenger, driver | The number for the bell badge. | done |
| PATCH | `/api/notifications/read-all` | passenger, driver | Mark every unread alert read. | done |
| PATCH | `/api/notifications/:notificationId/read` | passenger, driver | Mark one alert read. 403 for another user's alert. | done |
| DELETE | `/api/notifications` | passenger, driver | Clear the alerts already read; unread ones are kept. | done |
| DELETE | `/api/notifications/:notificationId` | passenger, driver | Dismiss one alert. | done |

Paging uses `NOTIFICATION_PAGE_SIZE` (20). The query asks for one row more than the page, so `hasMore`
costs no extra round trip.

## Alert subscriptions (`/api/alert-subscriptions`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/alert-subscriptions` | passenger | The routes the passenger follows, with their route populated. | done |
| POST | `/api/alert-subscriptions` | passenger | Follow a route. Body `{ routeId, alertType? }`. Following twice updates instead of failing. | done |
| PATCH | `/api/alert-subscriptions/:subscriptionId` | passenger | Change `alertType`, or pause/resume with `isActive`. | done |
| DELETE | `/api/alert-subscriptions/:subscriptionId` | passenger | Stop following a route. | done |

`alertType` is `approaching | delay | both`. Pausing keeps the row, so a passenger can go quiet for a
week without losing the setting.

## Delays (`/api/delays`, `/api/admin/delays`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/delays` | driver | Report a delay on the running trip. Body `{ reason, delayMinutes, reasonNote? }`. Reporting again **updates** the active report rather than creating a second. Returns `notifiedCount`. | done |
| GET | `/api/delays/active` | driver | The delay on the running trip, for the dashboard banner. | done |
| GET | `/api/delays/mine` | driver | The driver's history with the route each was on. `?status=` filters. | done |
| PATCH | `/api/delays/:delayReportId` | driver | Change the minutes or reason. Passengers are told again, because the number changed. | done |
| PATCH | `/api/delays/:delayReportId/resolve` | driver | "Back on time". Sends a second notification with the good news. | done |
| DELETE | `/api/delays/:delayReportId` | driver | Withdraw a report filed by mistake. Kept as `cancelled`, never deleted, so the admin table stays complete. | done |
| GET | `/api/admin/delays` | admin | The delay table with driver, bus and route. `?status=` and `?reason=` filter. | done |
| PATCH | `/api/admin/delays/:delayReportId` | admin | Add `adminNote` (the driver sees it) and/or change `status`. | done |

**Who gets told.** A delay notifies three groups, each person once: passengers holding an active
ticket on that trip (`ticketService.getActiveTicketHolderIds`, Member 03), passengers who saved the
route (`savedRouteService.getUserIdsBySavedRoute`, Member 02), and passengers who follow the route for
delay alerts. `reason = other` requires `reasonNote`, enforced in the model and in validation.

## Announcements (`/api/admin/announcements`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/announcements` | admin | Every announcement with its author, target route and what it delivered (alerts created and how many have been read), plus the counts above the table (draft, published, archived, alerts delivered, alerts read). `?status=` and `?severity=` filter the list, never the counts. | done |
| GET | `/api/admin/announcements/audience?targetRouteId=` | admin | How many distinct passengers a message would reach if it were sent now: every active passenger, or the followers of one route. Shown in the composer and in the send confirmation before anything goes out. | done |
| POST | `/api/admin/announcements` | admin | Write a draft. Body `{ title, message, severity?, targetRouteId?, expiresAt? }`. | done |
| PATCH | `/api/admin/announcements/:announcementId` | admin | Edit a draft. A published one returns 409. | done |
| PATCH | `/api/admin/announcements/:announcementId/publish` | admin | **The moment passengers are notified.** Returns `notifiedCount`. | done |
| PATCH | `/api/admin/announcements/:announcementId/archive` | admin | Retire a published announcement. | done |
| DELETE | `/api/admin/announcements/:announcementId` | admin | Delete a draft. A published one returns 409 — archive it instead. | done |

No `targetRouteId` means every active passenger; with one it reaches the passengers who saved or
follow that route. A published announcement is frozen so its text cannot drift from what was sent.

## Dashboard (`/api/admin/dashboard`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/dashboard/overview` | admin | KPI cards: passengers, drivers, buses, routes, ongoing trips, active delays, open inquiries, tickets today, takings today. | done |
| GET | `/api/admin/dashboard/performance` | admin | Seven-day series for tickets, takings and delays, plus busiest routes and punctuality. | done |

Every figure is counted from the collections. Days with nothing are returned as zero rather than
omitted, so a chart has no gaps. Punctuality counts a trip as on time when it has no delay report
that was not withdrawn.

## Shared services this module provides
`notificationService.createNotification({ recipientUserIds, type, title, message, related })` —
used by Member 02 and Member 03 (CLAUDE.md section 7). Duplicate recipients are collapsed, so a
passenger who both holds a ticket and follows the route is told once.
`delayService.getActiveDelayMinutes(tripId)` — used by Member 02's ETA, which adds these minutes to
every stop still ahead of the bus.
`alertSubscriptionService.getSubscriberUserIds(routeId, alertType)` — internal to Member 04 and used
by the announcement fan-out.
