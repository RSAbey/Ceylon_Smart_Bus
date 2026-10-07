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

## Prototype limits to state in the report

- **Payments are mocked.** No gateway is contacted. `POST /api/payments` records the chosen method and marks the
  ticket paid. A refund on cancellation flips the row to `refunded`; no money moves either way.
- **`validUntil` is 24 hours** from purchase (`TICKET_VALID_HOURS`). Nothing sweeps expired tickets on a schedule —
  verification compares `validUntil` to the current time when the driver checks, so an out-of-date ticket is refused
  correctly even though its stored `status` still reads `active`.
