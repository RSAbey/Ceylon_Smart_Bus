# Deviations from Figma — Member 03 (Tickets, seats & inquiries)

| Screen | Figma | Implemented | Reason |
|---|---|---|---|
| Payment | A card form with number, expiry and CVV fields | A method chooser (card / mobile wallet / cash to conductor) with a notice that no real money moves | Collecting card numbers in a university prototype would be a real security risk, and the ERD has no table to store them. `PAYMENT.method` is the only payment field the data model defines. |
| Payment Methods | Saved cards with add / remove | A read-only list of the accepted methods plus the passenger's own payment history | The ERD has no saved-card entity, and adding one would put the report out of sync with the submitted data model (CLAUDE.md section 3). |
| Book a Ticket | Stops typed into free-text fields | Stops chosen from a bottom-sheet picker listing only that route's stops in travel order | Typing cannot be validated against the route, and the fare depends on the exact stop record. The picker makes an invalid journey impossible to enter. |
| Seat Selection | Seat grid with no legend | The same grid with a three-item legend (Available / Your seat / Taken) and a seat state in every `accessibilityLabel` | Colour alone must not carry meaning (CLAUDE.md section 2, NFR-09). |
| Verify Ticket | Separate screens for scanning and for typing the code | One screen with a Scan QR / Type code toggle | NFR-06 requires the typed fallback to be reachable without leaving the scanner, since a cracked phone screen or dim light is the normal reason a scan fails. |
| Ticket Details | QR code always visible | QR shown only once the fare is paid and the ticket is still active; otherwise a locked panel explaining why | A QR on an unpaid or cancelled ticket would be scanned and rejected at the door, which is a worse experience than saying so up front. |

## Prototype limits to state in the report

- **Payments are mocked.** No gateway is contacted. `POST /api/payments` records the chosen method and marks the
  ticket paid. A refund on cancellation flips the row to `refunded`; no money moves either way.
- **`validUntil` is 24 hours** from purchase (`TICKET_VALID_HOURS`). Nothing sweeps expired tickets on a schedule —
  verification compares `validUntil` to the current time when the driver checks, so an out-of-date ticket is refused
  correctly even though its stored `status` still reads `active`.
