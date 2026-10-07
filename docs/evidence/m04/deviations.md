# Deviations from Figma — Member 04 (Home, notifications, delay, admin overview)

| Screen | Figma | Implemented | Reason |
|---|---|---|---|
| Drawer menu | Travel History and Settings entries | Both omitted | No member owns those features in Milestone 03, so a menu entry would lead nowhere. |
| Alerts | A flat list | The same list with type tabs (All / Delays / Tickets / News) and a "Clear read" action | A delay feed fills quickly; without a filter the ticket and payment alerts bury the delay a passenger is looking for. |
| Alerts | Unread shown by background colour | Unread also carries a left bar, a dot and a filled icon badge | Colour alone must not carry meaning (CLAUDE.md section 2, NFR-09). |
| Report Delay | Free-text minutes field | Six one-tap presets (5–60 min) | A driver reports from the cab, often at a stop with the engine running. Tapping is safer and faster than typing (NFR-06). |
| Report Delay | Reason chosen from a dropdown | Five large icon buttons | Same reason: a dropdown is a poor target one-handed, and the icons make the choice readable at a glance. |
| Performance | Line charts | CSS bar charts with the figure printed above each bar | A charting library would be a dependency added for four simple weekly series, which the brief discourages. Printing the figure also means the chart is readable without seeing colour. |
| Admin delay table | Acknowledge button only | Acknowledge with a note, plus Close | A note is what actually reaches the driver; the brief asks for the office to be able to respond, not just tick. |

## Design-system additions

- **`ScreenContainer` gained a `footer` prop** (mobile shared component). It pins a bar below the
  scrolling content, which the Select Seats running total needs. Additive and optional, so no
  existing screen changes behaviour.
- **`global.css` gained `.button-row`, `.stack-sm` and the `.bar-chart` block** (admin theme). All
  built from existing tokens; no new colour, spacing or font value was introduced.

## Prototype limits to state in the report

- **Alerts are in-app only.** There is no push notification: `NOTIFICATION` rows are created on the
  server and the app polls every 30 seconds. A real push service needs a paid account and a built
  app, neither of which is in scope for Milestone 03.
- **"Bus approaching" alerts are not generated automatically.** The type exists and the subscription
  can be set to it, but nothing watches bus positions to raise one, because that needs a scheduled
  job the free hosting tier does not run. Delay and announcement alerts are fully implemented.
- **Announcement `expiresAt` is stored but not swept.** Nothing hides an expired announcement on a
  schedule; the field is kept so the ERD stays accurate and an admin can still archive by hand.
