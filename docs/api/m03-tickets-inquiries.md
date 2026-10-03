# API contract — Member 03 (Tickets, seats, payments, verification, inquiries)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`. Fill one row per endpoint as you build it.
Status: `planned` → `in progress` → `done`.

## Tickets (`/api/tickets`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Seats (`/api/seats`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Payments (`/api/payments`, `/api/admin/finance`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Verification (`/api/verification`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Inquiries (`/api/inquiries`, `/api/admin/inquiries`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|

## Shared service (not HTTP)
`ticketService.getActiveTicketHolderIds(tripId)` — **done in foundation**.
