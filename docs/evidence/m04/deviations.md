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

## Modal sizing (admin shared component)

The dialog had no maximum height, so a long form grew past the viewport and pushed its own footer
off-screen: the route form's Save button could not be reached at all. Fixed in the shared `Modal`:

- the dialog is capped at `min(86vh, 880px)` and the **body scrolls**, with the header and footer
  pinned, so the action buttons are always reachable however long the form is;
- a `size="wide"` variant widens the dialog to 880px, which lets the existing `.form-grid` pairs
  fall into two columns instead of one tall stack;
- the route, bus, driver and announcement forms all use the wide variant.

Verified in a browser at 1440x900 and 1024x700: the body scrolls, the footer stays put, and the
stop Details panel expands without breaking the layout.

## Admin Notifications page (was Announcements)

| Figma | Implemented | Reason |
|---|---|---|
| Page titled "Notifications" | The page is Notifications; the rows are still `ANNOUNCEMENT` records | What an administrator writes is one record; what passengers receive is one `NOTIFICATION` each. The page is named for the job it does, and the file header says which entity it edits so the ERD still reads straight. `/announcements` redirects, so an old bookmark still works. |
| A sent / not sent flag | Alerts delivered and alerts read, counted from the `NOTIFICATION` rows the announcement created | "Published" only says what was intended. Counting the rows says what passengers actually received, and how many opened it — which is the figure that tells you whether the message landed. |
| (not in the design) | The composer and the send confirmation say how many passengers the message will reach | "All passengers" is not a number. Counting the audience before anything is sent is the difference between telling 3 people and telling nobody, and it is the same count the publish step then uses. |
| Every row offers Publish, Edit, Archive, Delete | Each action appears only where the server would accept it | A sent notification cannot be edited or deleted because its alerts are already in people's feeds. Offering a button that can only fail is worse than not offering it. |
| Message typed into a single-line box | A five-row textarea | The field holds up to 1000 characters; a one-line input hid all but the end of it while writing. |

## Admin dashboard redesign (Figma admin screen 59)

| Figma | Implemented | Reason |
|---|---|---|
| Four KPI cards with a coloured left edge | Six: the four from the design, plus tickets sold and takings today | The two money figures were already counted and are what a manager asks for first. Dropping them to match the picture would have hidden real data. |
| "Service Performance — on-time percentage, last 7 days" with an 80% target line | The same, counted per day from the trips that ran against the ones a driver reported a delay on | The database had no daily on-time figure before this; it is now worked out in `dashboard.service.js`. A trip with two reports is still one late bus, so the trip ids are collected as a set. |
| Delay summary panel | The same, from the open delay reports, with the route, bus, driver, minutes and reason | Nothing is sampled: these are the reports still open on the Delays page. |
| Live fleet map panel | The same real map as Live Fleet, at half height | One map component serves both pages, so what the dashboard shows and what Live Fleet shows cannot drift apart. |
| "System uptime 99.7%" pill | Omitted | Nothing measures uptime. A number on screen that no code produces would be invented. |
| Avatar with a dropdown in the page header | The signed-in name already sits in the top bar and opens My profile | One place for the account, not two. |
| Light sidebar (earlier build) | Dark navy sidebar with the current page as a solid blue block | Matches admin screens 59 and 60, which both show dark chrome. The colours are tokens (`--color-chrome*`) rather than hex in a screen. |
| Hamburger beside the page title on desktop | Only below 900px, where the sidebar is off-canvas | It was showing at every width: the shared `.icon-button` rule sits later in the stylesheet and was overriding `display: none`. The rule is now scoped to the top bar so it wins. |
