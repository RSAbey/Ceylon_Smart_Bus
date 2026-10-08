# Deviations from Figma — Member 03 (Tickets, seats & inquiries)

| Screen | Figma | Implemented | Reason |
|---|---|---|---|
| Payment | A card form with number, expiry and CVV fields | A method chooser plus a demo card form (number, name, expiry, CVV) when card is picked | The fields are validated for shape so the checkout behaves realistically, then discarded: the service never writes them to the database, and `PAYMENT` stores only amount, method and status. |
| Payment Methods | Saved cards with add / remove | The accepted methods, the passenger's payment history, and a link to the Mobile Wallet | A saved-card entity would mean storing card data. The wallet gives the same one-tap convenience by holding a prepaid balance instead, which is safe to store. |
| Book a Ticket | Stops typed into free-text fields | Stops chosen from a bottom-sheet picker listing only that route's stops in travel order | Typing cannot be validated against the route, and the fare depends on the exact stop record. The picker makes an invalid journey impossible to enter. |
| Seat Selection | Seat grid with a legend | The same grid, with an icon as well as a colour in the legend and a seat state in every `accessibilityLabel` | Colour alone must not carry meaning (CLAUDE.md section 2, NFR-09), so Occupied also shows an X and Selected a tick. |
| Verify Ticket | Separate screens for scanning and for typing the code | One screen with a Scan QR / Type code toggle | NFR-06 requires the typed fallback to be reachable without leaving the scanner, since a cracked phone screen or dim light is the normal reason a scan fails. |
| My Ticket | QR code always visible | QR shown only once the fare is paid and the ticket is still active; otherwise a locked panel explaining why | A QR on an unpaid or cancelled ticket would be scanned and rejected at the door, which is a worse experience than saying so up front. |
| My Ticket | "Working offline" / "Offline Ticket Available" pill | Both states implemented: the screen caches the ticket and falls back to the stored copy when the API cannot be reached | Buses are routinely out of coverage, which is exactly when the conductor asks to see the ticket (NFR-04). The pill says which copy is on screen and when it was last synced. |

## Admin Tickets & Finance page

| Figma | Implemented | Reason |
|---|---|---|
| A single revenue figure | Collected, refunded, average fare and failed payments, each over a period the administrator picks (today, 7 days, 30 days, all time) | "Revenue" on its own cannot be checked against anything. Splitting it says what was taken, what went back and what never completed, and the period makes the figure comparable with yesterday. |
| Revenue chart | Takings per day for the last seven days, drawn with the same shared bar chart as Performance | The Performance page already charts the week; reusing one component keeps the two pages agreeing rather than drifting apart. |
| Fare management | A fare table listing every route with its base fare, per-km rate, end-to-end fare and takings, and an Adjust fares dialog | The fare a passenger actually pays is the difference between two stop fares, not the route's `baseFare`. The dialog therefore offers a percentage revision that rewrites every stop fare, which is how a fare increase is really announced, and says so on screen. |
| Transactions list | The same list, with a Refund action on paid fares only | A refused action should never be offered: the button is hidden on fares that are already refunded or failed, and the dialog says what the refund will do to the ticket and the seat before it happens. |
| (not in the design) | Refunding a used ticket keeps its seat booked | That journey really happened and the trip may still be running, so releasing the seat would resell a seat somebody is sitting in. |

## Admin Inquiries page

| Figma | Implemented | Reason |
|---|---|---|
| Inbox list | The same list plus who it is assigned to and how long it has waited | Without an owner two administrators answer the same complaint; without a waiting time nobody can see which one has been ignored. An inquiry with no answer after 24 hours is named as such in words, not only coloured (NFR-09). |
| Detail panel sliding in from the right | The same content in the shared wide dialog | The dashboard already has one dialog component with a scrolling body and pinned actions; a second overlay pattern would be more code and one more thing to get wrong on a small screen. |
| Reply box | The same, with the conversation above it in order and the author and time on every message | A reply written without the thread in front of you is how a passenger gets answered twice about different things. |
| Close only | Close **and** Reopen | Replying to a closed inquiry is refused by the server, so without Reopen a passenger who writes again could never be answered on the same thread. |
| Counts over the filtered list | Counts over the whole inbox, whatever the table is filtered to | A figure that moves when you type in the search box cannot be used to decide what to work on next. |

## Prototype limits to state in the report

- **Payments are mocked.** No gateway is contacted. `POST /api/payments` records the chosen method and marks the
  ticket paid. A refund — whether the passenger cancels an unused ticket or an administrator refunds the fare from
  Tickets & Finance — flips the row to `refunded`; no money moves either way, except inside the mobile wallet, whose
  balance is a real stored figure and is credited back.
- **`validUntil` is 24 hours** from purchase (`TICKET_VALID_HOURS`). Nothing sweeps expired tickets on a schedule —
  verification compares `validUntil` to the current time when the driver checks, so an out-of-date ticket is refused
  correctly even though its stored `status` still reads `active`.
