# API contract — Member 03 (Tickets, seats, payments, verification, inquiries)

Envelope: `{ success, message, data }` / `{ success: false, message, errors }`. Fill one row per endpoint as you build it.
Status: `planned` → `in progress` → `done`.

## Tickets (`/api/tickets`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/tickets` | passenger | The caller's own tickets, newest first. `?status=active\|used\|cancelled\|expired` filters the tab. | done |
| GET | `/api/tickets/available-buses` | passenger | Buses in service now with route, departure, fare and free seats. Opened by the "Buy my ticket" button. | done |
| POST | `/api/tickets` | passenger | Book a ticket on an ongoing trip. Body `{ tripId, boardingStopId, alightingStopId, seatNumbers[] }`. The server prices the fare (segment fare x seats) and holds every seat; the ticket starts unpaid. | done |
| GET | `/api/tickets/:ticketId` | passenger | One ticket with its route, stops, seat and payment. 403 for another passenger's ticket (NFR-08). | done |
| PUT | `/api/tickets/:ticketId` | passenger | Change the stops or the seats while the ticket is still `active`. The fare is repriced. | done |
| DELETE | `/api/tickets/:ticketId` | passenger | Cancel: releases every seat and marks a paid fare `refunded`. A wallet-paid fare goes back to the wallet. A `used` ticket is refused. | done |

**Ticket states.** A ticket is created `active` but unpaid; a payment row makes it usable; a driver's successful
verification moves it to `used`; cancelling moves it to `cancelled`. `expired` is reached by `validUntil` passing.

## Seats (`/api/seats`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/seats/trip/:tripId` | passenger | Seat map for one trip: every label with `isBooked`, plus bus, route, departure, `seatsPerRow`, `maxSeatsPerTicket` and free/taken counts. | done |

Seats are labelled `1A`–`1D`, `2A`–… four to a row (2 + 2 across the aisle), generated from the bus capacity.
Booking and releasing are not endpoints: they happen inside ticket create / update / cancel, so a seat can never
be held without a ticket. **One ticket may hold up to `MAX_SEATS_PER_TICKET` (6) seats**, so a group travels on one
ticket and one fare; see `docs/evidence/m03/erd-changes.md`.

## Payments (`/api/payments`, `/api/admin/finance`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/payments/methods` | passenger | The accepted methods with the label and hint shown in the UI. | done |
| GET | `/api/payments` | passenger | The caller's own payment history. | done |
| POST | `/api/payments` | passenger | Pay a fare. Body `{ ticketId, method }`, plus `{ cardNumber, cardHolderName, cardExpiry, cardCvv }` when `method = card`. Creates the payment and a `payment` notification. Paying twice returns 409. | done |
| GET | `/api/payments/wallet` | passenger | Wallet balance and the last 20 statement lines. | done |
| POST | `/api/payments/wallet/topup` | passenger | Add money. Body `{ amount }` plus the four card fields. Rs. 100–10 000. | done |
| GET | `/api/admin/finance?days=&status=` | admin | Takings for the period (`days` = 1, 7 or 30; omit for all time): collected, refunded and failed totals, the average fare, totals by method, the 7-day takings trend, every route with its fares and what it earned, and the last 20 transactions, optionally narrowed by payment `status`. | done |
| POST | `/api/admin/finance/payments/:paymentId/refund` | admin | Refund one fare. Marks the payment `refunded`, cancels the ticket and releases its seat when the ticket is still active, credits a wallet payment back to the wallet, and tells the passenger. Refunding anything other than a paid fare returns 409. | done |

**Payments are mocked.** No gateway is called. The demo card fields are checked for shape (16 digits, MM/YY, 3-digit
CVV) so the checkout behaves like a real one, then **discarded** — `PAYMENT` stores only amount, method, status and
time. Paying by `wallet` moves real balance before the payment row is written, so a short balance returns 409 and
leaves the ticket unpaid. Cancelling a wallet-paid ticket returns the fare to the wallet as a `refund` line.

## Verification (`/api/verification`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| POST | `/api/verification` | driver | Check a ticket. Body `{ ticketKey }` for a typed code, or `{ ticketKey, qrSignature }` for a scan. Always answers 200 with `{ isValid, reason, ticket }`. | done |
| GET | `/api/verification/mine` | driver | The driver's last 10 checks. | done |

**Why an invalid ticket is still 200.** "Not a valid ticket" is a successful answer to the driver's question, not a
failed request, so the screen always has a `reason` to show. Refusal reasons, in the order checked: tampered QR
signature, wrong bus, already used, not active, expired, fare unpaid. A valid check marks the ticket `used`, so the
same ticket cannot be shown twice (NFR-07). Every check against a real ticket is stored in `TICKET_VERIFICATION`,
valid or not; an unmatched code has no ticket to reference, so no row is written.

## Inquiries (`/api/inquiries`, `/api/admin/inquiries`)
| Method | Path | Role | Purpose | Status |
|---|---|---|---|---|
| GET | `/api/inquiries` | passenger, driver | The caller's own inquiries with reply counts. `?status=` filters the tab. | done |
| POST | `/api/inquiries` | passenger, driver | Raise an inquiry. Body `{ subject, message, tag, priority?, routeId?, busId?, driverId? }`. | done |
| GET | `/api/inquiries/:inquiryId` | passenger, driver | One inquiry with its admin replies, `isEditable` and `editWindowMinutes`. | done |
| PUT | `/api/inquiries/:inquiryId` | passenger, driver | Correct an inquiry while still `open` and inside the 5-minute window. | done |
| DELETE | `/api/inquiries/:inquiryId` | passenger, driver | Withdraw an inquiry under the same two conditions. | done |
| GET | `/api/admin/inquiries` | admin | The inbox. `?status=`, `?tag=`, `?priority=` filter it. | done |
| GET | `/api/admin/inquiries/:inquiryId` | admin | One inquiry with its author and replies. | done |
| POST | `/api/admin/inquiries/:inquiryId/replies` | admin | Reply. Sets status `replied` and raises an `inquiry_reply` notification. | done |
| PATCH | `/api/admin/inquiries/:inquiryId/close` | admin | Close a dealt-with inquiry. | done |

**The 5-minute edit window** is enforced in `inquiry.service.js`, not only in the UI, so it cannot be bypassed by
calling the API directly. Once an admin has replied the text is frozen whatever the clock says, so the conversation
cannot be rewritten underneath the reply.

## Shared service (not HTTP)
`ticketService.getActiveTicketHolderIds(tripId)` — **done in foundation**, used by Member 04 for delay notifications.
`walletService.spendFromWallet` / `refundToWallet` — internal to Member 03; no other member calls them.

## Services this module consumes
- `notificationService.createNotification` (Member 04) — on payment and on an admin reply.
- `tripService.getDriverProfileForUser` / `getOngoingTripForDriver` (Member 02) — verification needs the driver's
  running trip to know which bus the ticket must belong to.
