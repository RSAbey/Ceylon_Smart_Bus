# Functional test cases — Member 04 (Home, notifications, delay reporting, admin overview)

> **Actual result and Pass/Fail stay EMPTY until the test has really been executed** (on the APK / hosted admin).
> Cover Create, Read, Update, Delete, validation errors and wrong-role access for every interface.
> TC-ID format: `TC-<area letter><number>` (for example TC-N01). Requirement ID = FR-xx / NFR-xx.

**Shared preconditions.** The API is running and `npm run seed` has been run. Passenger:
`kasun.wijesinghe@example.com`. Second passenger: `tharushi.fernando@example.com`. Driver:
`sunil.driver@ceylonsmartbus.lk`. Admin: `admin@ceylonsmartbus.lk`. Password: `CeylonBus@2026`.

## Alerts feed (N)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-N01 | Feed loads | At least one alert exists | Open the Alerts tab | Alerts listed newest first, each with an icon, type label and age | | | FR-03, FR-08 |
| TC-N02 | Unread are distinct | One read and one unread alert | Look at the list | Unread rows carry a left bar, a dot and a filled icon badge, not colour alone | | | NFR-09 |
| TC-N03 | Badge count | Two unread alerts | Look at the header | The header reads "Alerts (2)" | | | FR-03 |
| TC-N04 | Type tabs | Alerts of two types exist | Tap Delays, then Tickets | Each tab lists only alerts of that type | | | FR-03 |
| TC-N05 | Open an alert | A delay alert exists | Tap it | It opens live tracking for that bus and the alert becomes read | | | FR-02, FR-03 |
| TC-N06 | Mark all read | Unread alerts exist | Tap "Mark all read" | Every row becomes read and the header count disappears | | | FR-03 |
| TC-N07 | Dismiss one | Any alert | Tap its X | The row disappears and does not return after a refresh | | | FR-03 |
| TC-N08 | Clear read | Read and unread alerts exist | Tap "Clear read alerts" and confirm | Read alerts go; unread ones remain | | | FR-03 |
| TC-N09 | Another user's alert | Note an alert id from passenger A | Sign in as the second passenger and PATCH that id as read | 403 | | | NFR-08 |
| TC-N10 | Empty state | A passenger with no alerts | Open Alerts | "No alerts yet" with a link to alert settings | | | FR-03 |
| TC-N11 | Live refresh | Alerts screen open | Have the driver report a delay on a followed route | The new alert appears within 30 seconds without leaving the screen | | | FR-08, NFR-01 |

## Alert settings (S)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-S01 | Follow a route | Signed in | Alert Settings → Follow another route → pick one | The route appears with "Both" selected | | | FR-03 |
| TC-S02 | Follow twice | Already following a route | Try to follow the same route | It is not offered again in the picker | | | FR-03 |
| TC-S03 | Narrow the type | A followed route | Choose "Delays only" | The choice is saved and survives a reload | | | FR-03 |
| TC-S04 | Pause alerts | A followed route | Turn the switch off | The options hide and a paused note appears | | | FR-03 |
| TC-S05 | Paused means silent | A paused route | Publish an announcement for that route | No new alert arrives from the subscription | | | FR-03 |
| TC-S06 | Stop following | A followed route | Tap "Stop following" and confirm | The route disappears from the list | | | FR-03 |
| TC-S07 | Another user's setting | Note a subscription id from passenger A | PATCH it as the second passenger | 403 | | | NFR-08 |
| TC-S08 | Empty state | Following nothing | Open Alert Settings | "No routes followed yet" with a button to follow one | | | FR-03 |

## Delay reporting (D)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-D01 | Report a delay | Driver on a running trip | Report Delay → Heavy traffic → 15 min → Tell passengers | Success toast naming how many passengers were told | | | FR-08 |
| TC-D02 | Reason required | On the form | Tap submit with nothing chosen | "What is holding the bus up?" is shown; nothing is sent | | | FR-08 |
| TC-D03 | Minutes required | A reason chosen only | Tap submit | "How late are you?" is shown | | | FR-08 |
| TC-D04 | Other needs a note | Reason = Other, note empty | Tap submit | "Describe what is holding the bus up." is shown | | | FR-08 |
| TC-D05 | No trip running | Driver has not started a trip | Try to report | 409 "Start your trip before reporting a delay" | | | FR-08 |
| TC-D06 | Passengers are told | A passenger follows the route | Report a delay | The passenger's Alerts shows "running 15 min late" with the reason | | | FR-08 |
| TC-D07 | Ticket holders are told | A passenger holds a ticket on that trip | Report a delay | That passenger gets the alert even without following the route | | | FR-08 |
| TC-D08 | ETA is padded | A delay of 15 min is active | Open live tracking as a passenger | The arrival time includes the delay and the badge reads Delayed | | | FR-02, FR-08 |
| TC-D09 | One active delay | A delay is already active | Report again with different minutes | The same report updates; no second active report is created | | | FR-08 |
| TC-D10 | Back on time | An active delay | Tap "Back on time" and confirm | Status becomes Resolved, passengers get the good news and the ETA stops being padded | | | FR-08 |
| TC-D11 | Resolve twice | A resolved report | Resolve it again | 409 | | | FR-08 |
| TC-D12 | Withdraw | An active delay | Tap Withdraw and confirm | Status becomes Withdrawn and it still shows in the admin table | | | FR-08 |
| TC-D13 | History | Two past reports | Open Delay History | Both listed with route, minutes, reason and status | | | FR-08 |
| TC-D14 | Passenger cannot report | Signed in as a passenger | POST `/api/delays` | 403 | | | NFR-08 |

## Driver dashboard (H)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-H01 | Dashboard loads | Driver with an assigned bus | Sign in as a driver | Bus, route, stop count and trip status are shown | | | FR-01 |
| TC-H02 | No bus assigned | A driver with no bus | Open the dashboard | A clear "No bus assigned" message, not a crash | | | FR-01 |
| TC-H03 | On-time banner | Trip running, no delay | Open the dashboard | Green "Running on time" strip | | | FR-08 |
| TC-H04 | Delay banner | Trip running with an active delay | Open the dashboard | Amber strip with the minutes and a button to update it | | | FR-08 |
| TC-H05 | Quick actions | Any driver | Tap each of the four cards | They open Trip, Report Delay, Verify Ticket and Support | | | FR-01 |

## Admin overview and performance (O)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-O01 | KPI cards | Seeded data | Admin → Overview | Six cards with real counts and a coloured edge, not placeholders | | | FR-10 |
| TC-O02 | Needs attention | An active delay and an open inquiry | Open Overview | A "Needs attention" panel linking to Delays and Inquiries | | | FR-10 |
| TC-O03 | Takings today | A fare paid today | Open Overview | "Collected today" matches the sum of today's paid fares | | | FR-10 |
| TC-O04 | Performance charts | Tickets over several days | Admin → Performance | Three bar charts, each with seven columns and a figure above each bar | | | FR-10 |
| TC-O05 | Empty days | A day with no tickets | Look at that column | The column shows 0, not a gap | | | FR-10 |
| TC-O06 | Busiest routes | Tickets on two routes | Look at the table | Routes ordered by tickets sold, with fares totalled | | | FR-10 |
| TC-O07 | Punctuality | One delayed and one clean trip | Look at the on-time card | The percentage matches the trip counts shown beside it | | | FR-10 |
| TC-O08 | Driver cannot open it | Signed in as a driver | Request `/api/admin/dashboard/overview` | 403 | | | NFR-08 |
| TC-O09 | On-time chart | Trips over several days, some delayed | Open the dashboard | Seven columns of on-time percentage with the 80% target line drawn across them | | | FR-10 |
| TC-O10 | The chart agrees with the delays | A day with one delayed trip out of four | Compare that column with the Delays page | The percentage matches the trips that ran against the ones reported late | | | FR-10, NFR-02 |
| TC-O11 | Delay summary | Open delay reports exist | Look at the panel | Each one names its route, bus, driver, minutes and reason, and the link opens the Delays page | | | FR-08, FR-10 |
| TC-O12 | Delay summary when clear | No open delay | Look at the panel | "No delay is open right now", not an empty box | | | FR-10 |
| TC-O13 | Dashboard map | A driver is driving | Look at the live fleet panel | A street map with that bus on it and the time it was last updated | | | FR-02, FR-10 |
| TC-O14 | No hamburger on desktop | Window wider than 900px | Look beside the page name in the top bar | No menu button; the sidebar is already on screen | | | NFR-10 |
| TC-O15 | Hamburger on a narrow window | Window under 900px | Look at the top bar | The menu button is back and opens the sidebar | | | NFR-10 |

## Admin delays and notifications (A)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-A01 | Delay table | A reported delay | Admin → Delays | Row with route, bus, driver, minutes, reason and status | | | FR-08, FR-10 |
| TC-A02 | Filter by status | Active and resolved reports | Tap Active, then Resolved | Each filter shows only matching rows | | | FR-10 |
| TC-A03 | Note to the driver | Any report | Add note → save | The driver sees the note in their Delay History | | | FR-08 |
| TC-A04 | Close a delay | An active report | Close → confirm | Status becomes Resolved | | | FR-08 |
| TC-A05 | Write a draft | Admin signed in | Announcements → Write → fill → Save draft | Row added with status Draft; no passenger is notified yet | | | FR-10 |
| TC-A06 | Validation | On the form | Enter a 3-character message | "Write between 10 and 1000 characters" and nothing is saved | | | FR-10 |
| TC-A07 | Publish to all | A draft with no target route | Publish → confirm | Every active passenger gets an alert; the count is reported | | | FR-10 |
| TC-A08 | Publish to a route | A draft targeting a route | Publish | Only passengers who saved or follow that route get it | | | FR-10 |
| TC-A09 | Published is frozen | A published announcement | Try to edit it | 409 "already been sent to passengers" | | | FR-10 |
| TC-A10 | Published cannot be deleted | A published announcement | Try to delete it | 409 telling you to archive instead | | | FR-10 |
| TC-A11 | Archive | A published announcement | Archive it | Status becomes Archived; passenger alerts already sent are untouched | | | FR-10 |
| TC-A12 | Passenger cannot broadcast | Signed in as a passenger | POST `/api/admin/announcements` | 403 | | | NFR-08 |
| TC-A13 | Audience before sending | Composer open | Look at the notice under the form, then switch the target from All passengers to a route | It names how many passengers the message would reach, and the figure changes with the target | | | FR-10 |
| TC-A14 | The send dialog names the audience | A draft | Press Send | The confirmation says how many passengers get an alert, and that it cannot be taken back | | | FR-10 |
| TC-A15 | What was delivered | A sent notification | Look at its row | It shows how many alerts were created and how many have been read, with the date | | | FR-10 |
| TC-A16 | Read figures follow the app | A sent notification with an unread alert | Open that alert in the passenger app, then reload the page | The read figure rises by one | | | FR-03, FR-10 |
| TC-A17 | Actions match the state | A draft, a sent and an archived notification | Look at each row | Draft offers Send, Edit and Delete; sent offers Archive only; archived offers nothing | | | FR-10, NFR-10 |
| TC-A18 | Counts over everything | Notifications in more than one state | Press the Drafts chip | The table narrows but the four figures above still describe every notification | | | FR-10 |
| TC-A19 | Old link still works | Signed in as admin | Open `/announcements` in the browser | The dashboard lands on Notifications | | | NFR-10 |

## Development checks already run (not a substitute for the table above)

The notification screen was exercised with a throwaway script against the development server and
MongoDB Atlas on 2026-10-08: **33 assertions, all passing**, covering the audience count against the
passenger roster, writing and editing a draft, publishing through to the alert arriving in the
passenger's own feed with the edited wording, the delivered and read figures, the refusals to edit,
delete or send twice, the status filter and archiving.

The API behind these cases was exercised with a throwaway script against the development server and
MongoDB Atlas on 2026-10-07: **64 assertions, all passing**, covering the subscription lifecycle, the
delay fan-out to ticket holders and route followers, the one-active-delay rule, the delay feeding
Member 02's ETA and clearing again on resolve, the whole notification feed including the 403s, the
announcement draft/publish/freeze/archive rules, and the dashboard figures. The Android bundle
(`npx expo export`) and the admin production build (`vite build`) both succeed.

That is a developer check on localhost, **not** the device and hosted testing this table records.
Every Actual / Pass-Fail cell above stays empty until the case is run on the APK and the hosted
admin dashboard.
