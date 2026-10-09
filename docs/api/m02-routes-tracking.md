# API contract — Member 02 (Routes & tracking)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`. Fill one row per endpoint as you build it.
Status: `planned` → `in progress` → `done`.

## Routes (`/api/routes`, `/api/admin/routes`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| PATCH | `/api/admin/routes/:routeId/fares` | admin | Reprice a route from the finance page. Body `{ baseFare?, perKmRate?, adjustPercent? }`; `adjustPercent` (−50 to 100) revises every stop fare on the route and rounds each to the rupee, which is what passengers are then charged. Returns the route, its stops and how many stop fares changed. | done |

## Buses (`/api/admin/buses`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Trips (`/api/trips`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Tracking (`/api/tracking`, `/api/admin/fleet`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/fleet` | admin | Live Fleet screen: every ongoing trip with its bus, route, driver, latest position, speed, active delay, progress along the route and passengers holding a ticket, plus the stops of each route being served (for the map) and the summary counts. | done |
| POST | `/api/admin/fleet/:tripId/end` | admin | Closes a trip the driver app left running, as `cancelled`. Refused with 409 while the bus is still reporting its position (under 15 minutes of silence). | done |

## Saved routes (`/api/saved-routes`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Shared services (not HTTP)
`tripService.getOngoingTripForDriver(driverId)` and `savedRouteService.getUserIdsBySavedRoute(routeId)` — **done in foundation**.
