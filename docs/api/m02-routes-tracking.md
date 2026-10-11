# API contract — Member 02 (Routes & tracking)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`. Fill one row per endpoint as you build it.
Status: `planned` → `in progress` → `done`.

## Routes (`/api/routes`, `/api/admin/routes`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/admin/routes/place-suggestions?query=` | admin | Places matching a typed stop name, so a stop is picked from a list rather than its coordinates typed. Returns `{ suggestions: [{ placeId, stopName, description, latitude, longitude }] }`. Answered by Nominatim, OpenStreetMap's own geocoder: no key, no account, results limited to Sri Lanka. Called from the server so the usage policy's User-Agent requirement is met and both admin clients share one implementation; `502` when the geocoder cannot be reached, and the forms let coordinates be typed instead. | done |
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

## The line the maps draw

`GET /api/tracking/trips/:tripId` and every row of `GET /api/admin/fleet` carry the route's line
split at the bus:

- **`pathAhead`** — the leg still in front of it, **starting at the bus's own position**, so a map
  draws the journey left to make rather than the route on paper.
- **`pathTravelled`** — the leg already covered, which the maps draw faint and dashed behind it.

Both are `[{ latitude, longitude }]`. The split is worked out once in `server/src/utils/routePath.js`
so the dashboard and the phone cannot draw different lines. With no fresh position the whole route
is reported as `pathAhead` and nothing as travelled, rather than guessing where the bus is.
