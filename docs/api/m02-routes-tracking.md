# API contract — Member 02 (Routes & tracking)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`. Fill one row per endpoint as you build it.
Status: `planned` → `in progress` → `done`.

## Routes (`/api/routes`, `/api/admin/routes`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Buses (`/api/admin/buses`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Trips (`/api/trips`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Tracking (`/api/tracking`, `/api/admin/fleet`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Saved routes (`/api/saved-routes`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Shared services (not HTTP)
`tripService.getOngoingTripForDriver(driverId)` and `savedRouteService.getUserIdsBySavedRoute(routeId)` — **done in foundation**.
