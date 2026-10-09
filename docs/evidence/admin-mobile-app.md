# The admin area of the mobile app — what was built and what differs from the dashboard

Four of the web dashboard's management sections now exist inside the mobile app, against the same
API and the same login. This is the record of what was built, which member each section belongs to,
and every place the phone version deliberately differs from the dashboard.

Test cases: `docs/testing/functional/admin-mobile.md` (TC-AM01 to TC-AM57).

## Two CRUD interfaces per member

| Section | Member | Tables | Operations on the phone |
|---|---|---|---|
| Notifications | 04 | `ANNOUNCEMENT` | create · read · update · delete, plus publish and archive |
| Inquiries | 03 | `INQUIRY`, `INQUIRY_REPLY` | read · reply (create) · assign (update) · close and reopen (update) |
| Routes | 02 | `ROUTE`, `ROUTE_STOP` | create · read · update · delete, stops included |
| Transport Data | 01 and 02 | `BUS`, `DRIVER_PROFILE`, `USER` | create · read · update · delete for both, plus bus assignment |

## No new API, and no new endpoint

Every screen calls an endpoint the dashboard already used. Nothing was added to the server and
nothing was changed, so the two admin interfaces cannot drift apart: a rule enforced for the
dashboard is enforced for the phone by the same code. The admin services in
`mobile/src/features/admin/services/` are deliberately near-copies of the dashboard's own
`admin/src/pages/*/\*Api.js`, for that reason.

## The one real change: an admin may now hold a mobile session

`AuthContext.applySession` used to refuse an admin outright, with "Admins use the web dashboard."
That refusal has been removed and `(admin)` added to the role route groups, so the role guard in
`app/_layout.js` keeps an admin inside the admin area exactly as it keeps a driver inside theirs.

**This is a reversal of an earlier decision**, which the report should say plainly rather than quietly
drop: the original plan was that the mobile app served passengers and drivers only. It changed
because the assignment asks each member for two CRUD interfaces, and building them against the
dashboard's own sections keeps one set of business rules instead of inventing a second.

## Deviations from the dashboard

| Dashboard | On the phone | Why |
|---|---|---|
| Dark chrome **sidebar** | Dark chrome **bottom bar** (`AdminTabBar`) | A sidebar does not fit a phone, but the chrome is what says "this is the management app". The five mobile tokens are the same five values as `admin/src/theme/tokens.css`, copied into `mobile/src/theme/colors.js` as `colors.chrome`. |
| Ten sidebar items | Five tabs | Only the four sections asked for, plus Account. Live Fleet, Finance, Delays, Passengers, Performance and Overview stay on the dashboard, where there is room for a map and a chart. |
| Tables with a row-action menu | One card per record, actions as buttons | A table cannot be read on a phone. Each card carries the same fields the table column headings carried, and the row menu becomes labelled buttons. |
| `<select>` dropdowns | `AdminPickerField`, options as pills | A dropdown on a phone hides its choices behind a tap. Pills show every choice at once and each is a full touch target. |
| Date pickers | A typed `YYYY-MM-DD` field | Four date fields did not justify adding a date-picker library. The format is stated in the field's hint and checked before sending. |
| Filter row with counts | Scrolling chip row with the same counts | Same information, one gesture. |
| A `StatusBadge` per state | `AdminStatusChip` | The shared `StatusBadge` is a fixed vocabulary of passenger statuses (On time, Valid, Cancelled) with its own labels and icons. The admin states are different words entirely, so the chip takes the words and a tone — and keeps an icon, so no state is told by colour alone (NFR-09). |
| Transport Data shows buses and drivers together | A switch chooses one | Two tables side by side need a desktop. Switching also clears the filter, because a bus status is not a driver duty status. |
| Drag to reorder route stops | Move up / move down buttons | A drag handle beside four text fields on a phone is easy to trigger by accident; two arrows are not. |
| My Profile edits the admin account | The Account tab only shows who is signed in, and signs out | Editing the account in two places would give two places to change one thing. The dashboard keeps that job. |
| — | The Inquiries tab carries a badge | The number of open inquiries is what an administrator works from, so it is on the tab rather than one screen deeper. It refreshes on the same interval as the passenger app's notification badge, so the admin area adds no new polling rhythm to explain. |

## Decisions worth defending in a viva

**A published notification cannot be edited or deleted on the phone, only archived.** The server
already refuses to delete a published announcement, because the alerts it sent have reached
passengers and deleting the record would leave those alerts pointing at nothing. The phone shows
only the actions that can actually succeed, rather than offering a button that returns an error.

**Saving a notification notifies nobody.** The button says "Save draft" and the screen says so
underneath. Publishing is a separate, deliberate action, because it is the irreversible one.

**The route form replaces the whole stop list.** That is what `PATCH /admin/routes/:id` does with a
`stops` array, so the screen says it in as many words when editing an existing route.

**A driver's password cannot be changed from the admin form.** Registering one sets a first password;
after that it is the driver's own to change from their profile, and the form says so.

**The bus code is not on the bus form.** The server allocates `BUS-014`, so two administrators
cannot invent the same code.

## What was found while building this

The mobile bus form originally checked only that the plate was not empty, while the server requires
`AB-1234`. A plate like `ABC` would have been accepted by the form and refused by the server. The
form now applies the same pattern, so the error arrives before the request does.

## Not verified

Nothing in this area has been run on a device. The API side is covered by a 71-assertion script
(see the test-case file) and the mobile side by a successful Metro bundle, which proves every import
resolves and nothing more.
