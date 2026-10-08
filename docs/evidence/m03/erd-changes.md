# Data model changes — Member 03

`docs/ERD_AND_RELATIONAL.md` and the ERD diagram in the report **must be updated** with the eight changes below.
They were made to build the Select Seats, My Ticket and wallet screens and the admin dashboard, and the code and the
submitted ERD are out of sync until the diagram is redrawn.

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

## 6. Admin dashboard fields (Transport Data)

Agreed with the team on 2026-10-08 as "Group A": columns the admin mockups need, no new tables.

| Table | Column | Type | Notes |
|---|---|---|---|
| `BUS` | `busCode` | string | **UK**, "BUS-014". Generated on registration; staff say it out loud, unlike a Mongo id |
| `BUS` | `model` | string | Chosen from a fixed `BUS_MODELS` list |
| `BUS` | `gpsDeviceId` | string | Traces a faulty tracker to a vehicle |
| `BUS` | `lastServicedAt` | date | Shown on the fleet table |
| `BUS` | `status` | enum | **`retired` added** to `active \| maintenance` |
| `DRIVER_PROFILE` | `licenseClass` | enum | `heavy_vehicle \| light_vehicle \| dual_purpose` |
| `DRIVER_PROFILE` | `dutyStatus` | enum | `active \| on_leave \| suspended` |

**Why `dutyStatus` is separate from `USER.status`.** They answer different questions. `USER.status`
is whether the account works; `dutyStatus` is whether the person is available to drive. A driver on
leave can still sign in and read notices. Suspending one sets **both**, so the suspension is not
only on paper.

Existing rows in Atlas were backfilled: three buses given `BUS-001`–`BUS-003`, and both drivers
given `dutyStatus: active` with `licenseClass: heavy_vehicle`.

## 7. Route fields (admin Routes page)

Group A, agreed 2026-10-08.

| Table | Column | Type | Notes |
|---|---|---|---|
| `ROUTE` | `serviceStartTime` | string | "HH:MM" first departure |
| `ROUTE` | `serviceEndTime` | string | "HH:MM" last departure |
| `ROUTE` | `perKmRate` | number | Reference rate for repricing; stop fares stay authoritative |
| `ROUTE` | `status` | enum | **`active \| inactive` replaced by `active \| draft \| suspended`** |
| `ROUTE` | `updatedAt` | date | Timestamps turned on, for the "last updated" line |

`inactive` was declared in the constants but never used anywhere in the code, so replacing it broke
nothing. No stored route used it either, so the migration moved zero rows.

**Draft is a real gate, not a label.** Passenger search and the stop-name picker both filter on
`active`, so a draft route is invisible to passengers until an admin activates it, and a suspended
one disappears again.

## 8. `INQUIRY.assigneeId` (admin inbox)

Group B, agreed 2026-10-08.

| Table | Column | Type | Notes |
|---|---|---|---|
| `INQUIRY` | `assigneeId` | ObjectId | FK to USER, nullable. The administrator dealing with it |

Relationship: `USER ||--o{ INQUIRY : "handles"`, alongside the existing `USER ||--o{ INQUIRY : raises`.

**Why.** The inbox mockup shows who owns each inquiry, and without it two administrators answer the same complaint
while another waits for days. The field is nullable on purpose: an inquiry nobody has picked up sits in an
"unassigned" queue the inbox can filter on, which is the queue staff work from. The service refuses an assignee
whose role is not `admin`, so an inquiry cannot be hidden by assigning it to a passenger.

No stored inquiry needed backfilling: an absent `assigneeId` already means unassigned.

## What did NOT change

No card data is stored. The demo card number, holder name, expiry and CVV are validated for shape and then
discarded; `PAYMENT` still holds only `amount`, `method`, `status` and `paidAt`. This was verified by reading the
stored payment document back and confirming it has no card field.
