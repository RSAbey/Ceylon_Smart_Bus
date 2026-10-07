# Data model changes — Member 03

`docs/ERD_AND_RELATIONAL.md` and the ERD diagram in the report **must be updated** with the four changes below.
They were made to build the Select Seats, My Ticket and wallet screens, and the code and the submitted ERD are out
of sync until the diagram is redrawn.

## 1. A ticket may hold several seats

| Was | Now |
|---|---|
| `TICKET \|\|--o\| SEAT_BOOKING : reserves` | `TICKET \|\|--o{ SEAT_BOOKING : reserves` |
| `SEAT_BOOKING.ticketId FK "UK"` | `SEAT_BOOKING.ticketId FK` (unique constraint removed, plain index kept) |

**Why.** The Select Seats mockup books 4C and 4D on one ticket for one fare, so one ticket must own several seat
rows. `TICKET.fareAmount` is now the segment fare multiplied by the number of seats; the API also returns
`perSeatFare` so a screen can show "2 seats x Rs. 80".

The old unique index already existed in Atlas and was dropped there, since Mongoose does not remove an index that
is no longer declared. If the database is ever rebuilt from scratch this is handled automatically.

## 2. New table: `WALLET`

| Column | Type | Notes |
|---|---|---|
| `walletId` | ObjectId | PK |
| `userId` | ObjectId | FK to USER, **UK** — one wallet per passenger |
| `balance` | number | Rupees available, never below 0 |
| `createdAt` / `updatedAt` | date | |

Relationship: `USER ||--o| WALLET : "tops up"`.

## 3. New table: `WALLET_TRANSACTION`

| Column | Type | Notes |
|---|---|---|
| `walletTransactionId` | ObjectId | PK |
| `walletId` | ObjectId | FK to WALLET |
| `type` | string | `topup \| fare \| refund` |
| `amount` | number | Always positive; `type` says the direction |
| `balanceAfter` | number | Running balance, so a statement reads without recomputing |
| `description` | string | The line shown to the passenger |
| `ticketId` | ObjectId | FK to TICKET, set for fare and refund lines |
| `createdAt` | date | |

Relationships: `WALLET ||--o{ WALLET_TRANSACTION : records` and `TICKET |o--o{ WALLET_TRANSACTION : "paid by"`.

**Why.** The brief asks for a mobile wallet the passenger tops up and then spends. A balance alone cannot be
explained or audited, so every movement is a line and the balance is the latest `balanceAfter`.

## 4. `TICKET.ticketKey` format

| Was | Now |
|---|---|
| `CSB-408213` (six random digits) | `CSB-20260919-0417` (date + that day's sequence) |

**Why.** It matches the My Ticket mockup, it is easier to read out over a bad phone line, and it groups a day's
tickets together for the conductor and the finance report.

## 5. `TRIP.isAcceptingBookings`

| Column | Type | Notes |
|---|---|---|
| `isAcceptingBookings` | boolean | Defaults to true |

**Why.** The driver's Bookings screen has a switch that closes a filling bus to new seat
reservations. It is enforced server-side, not just drawn: a closed trip refuses new tickets and
drops out of the passenger "Buy my ticket" picker, while seats already booked are untouched.

## What did NOT change

No card data is stored. The demo card number, holder name, expiry and CVV are validated for shape and then
discarded; `PAYMENT` still holds only `amount`, `method`, `status` and `paidAt`. This was verified by reading the
stored payment document back and confirming it has no card field.
