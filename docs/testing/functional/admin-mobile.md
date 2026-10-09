# Functional test cases — the admin area of the mobile app (all four members)

> **Actual result and Pass/Fail stay EMPTY until the test has really been executed** (on the APK).
> TC-ID format: `TC-<area letters><number>`, here `TC-AM<number>`. Requirement ID = FR-xx / NFR-xx.

This area puts four of the web dashboard's management sections on the phone, against the same API.
Each section is one member's two CRUD operations:

| Section | Member | Records |
|---|---|---|
| Notifications | 04 | `ANNOUNCEMENT` (create, read, update, delete, publish, archive) |
| Inquiries | 03 | `INQUIRY` + `INQUIRY_REPLY` (read, reply, assign, close, reopen) |
| Routes | 02 | `ROUTE` + `ROUTE_STOP` (create, read, update, delete) |
| Transport Data | 01 + 02 | `BUS` and `DRIVER_PROFILE` (create, read, update, delete, assign) |

**Shared preconditions.** The API is running and `npm run seed` has been run. Admin:
`admin@ceylonsmartbus.lk`. Password: `CeylonBus@2026`. Sign in on the phone with the same
credentials as the dashboard — there is no separate admin login.

## Signing in and getting around (AM)
| TC-ID | What is tested | Precondition | Steps | Expected result | Actual result | Pass/Fail | Req |
|---|---|---|---|---|---|---|---|
| TC-AM01 | An admin can sign in on the phone | Signed out | Sign in with the admin email and password | The app opens on the admin area, not the passenger home and not an "admins use the dashboard" refusal | | | FR-01 |
| TC-AM02 | The navigation bar is the admin one | Signed in as admin | Look at the bottom bar | Dark bar matching the dashboard sidebar, with Notices, Inquiries, Routes, Transport and Account | | | NFR-10 |
| TC-AM03 | Every tab opens | As TC-AM02 | Tap each of the five tabs | Each loads its own screen; the open tab is marked by both the amber bar above it and its amber label | | | NFR-09 |
| TC-AM04 | The inquiry badge counts | At least one open inquiry | Look at the Inquiries tab | A badge shows how many are open, and matches the Open chip count inside the screen | | | FR-07 |
| TC-AM05 | A passenger cannot reach the admin area | Signed in as a passenger | Try to open an admin screen | The role guard returns the passenger to their own home | | | NFR-07 |
| TC-AM06 | An admin stays out of the passenger area | Signed in as admin | Try to open a passenger screen | The guard returns the admin to the admin area | | | NFR-07 |
| TC-AM07 | Signing out | Signed in as admin | Account → Log out → confirm | The sign-in screen appears and the session is gone | | | FR-01 |

## Notifications — Member 04 (AM)
| TC-ID | What is tested | Precondition | Steps | Expected result | Actual result | Pass/Fail | Req |
|---|---|---|---|---|---|---|---|
| TC-AM08 | Read the list | Signed in as admin | Open Notices | Every announcement as a card with its severity, status, delivered and read counts, and who wrote it | | | FR-08 |
| TC-AM09 | Filter chips carry counts | As TC-AM08 | Tap Drafts, then Published, then Archived | The list narrows each time and each chip shows its own count | | | FR-08 |
| TC-AM10 | Create a notification | As TC-AM08 | New notification → title, message, severity, audience → Save draft | Saved as a draft, and the card appears in the list | | | FR-08 |
| TC-AM11 | The audience is counted before publishing | On the form | Switch the audience between Every passenger and one route | The card under the form updates to how many passengers would be notified | | | FR-08 |
| TC-AM12 | Empty title and short message refused | On the form | Save with no title and a 3-character message | Both fields show what is wrong and nothing is saved | | | FR-08 |
| TC-AM13 | A bad expiry date is refused | On the form | Type `20-10-2026` as the expiry | "Enter the date as YYYY-MM-DD." and nothing is saved | | | FR-08 |
| TC-AM14 | Update a draft | A draft exists | Edit → change the title and severity → Save changes | The card shows the new title and severity | | | FR-08 |
| TC-AM15 | Publish | A draft exists | Publish | A toast confirms, the status becomes published, and a passenger signed in elsewhere has the alert | | | FR-08 |
| TC-AM16 | A published notice cannot be edited or deleted | TC-AM15 done | Look at the published card | Only Archive is offered — no Edit, no Delete | | | FR-08 |
| TC-AM17 | Archive | A published notice exists | Archive | The status becomes archived and alerts already sent are untouched | | | FR-08 |
| TC-AM18 | Delete a draft | A draft exists | Delete → confirm | The dialog says no passenger has seen it; the card disappears | | | FR-08 |

## Inquiries — Member 03 (AM)
| TC-ID | What is tested | Precondition | Steps | Expected result | Actual result | Pass/Fail | Req |
|---|---|---|---|---|---|---|---|
| TC-AM19 | Read the inbox | Inquiries exist | Open Inquiries | Cards with status, priority, tag, author, wait time and reply count, and the two attention counts above | | | FR-07 |
| TC-AM20 | A late inquiry is flagged | An inquiry older than the target | Look at its card | A "Past the target" chip as well as the wait time | | | FR-07, NFR-09 |
| TC-AM21 | Search | As TC-AM19 | Type part of a subject | Only matching inquiries remain | | | FR-07 |
| TC-AM22 | Open the conversation | As TC-AM19 | Open conversation | The passenger's message and every reply, in order, with who wrote each and when | | | FR-07 |
| TC-AM23 | Reply | A conversation is open | Write an answer → Send | A toast confirms, the reply joins the thread, and the status becomes replied | | | FR-07 |
| TC-AM24 | The passenger sees the reply | TC-AM23 done | Sign in as the author and open their inquiry | The same reply is in their own thread and they have an alert | | | FR-07 |
| TC-AM25 | An empty reply is refused | A conversation is open | Send with the box empty | "Write an answer before sending it." and nothing is sent | | | FR-07 |
| TC-AM26 | Take it on and hand it back | A conversation is open | Take this on, then Hand it back | The assignee line changes both times, and the inbox's unassigned count moves with it | | | FR-07 |
| TC-AM27 | Close and reopen | A conversation is open | Close this inquiry, then Reopen | Closed hides the reply box and says so; reopening brings it back | | | FR-07 |

## Routes — Member 02 (AM)
| TC-ID | What is tested | Precondition | Steps | Expected result | Actual result | Pass/Fail | Req |
|---|---|---|---|---|---|---|---|
| TC-AM28 | Read the list | Routes exist | Open Routes | Cards with the number, name, endpoints, status, stop count, base fare, service hours and recent delays | | | FR-03 |
| TC-AM29 | Search and filter | As TC-AM28 | Search an origin, then tap Active | The list narrows on both | | | FR-03 |
| TC-AM30 | Create a route | As TC-AM28 | New route → fill the fields → two stops → Create | The route appears in the list with 2 stops | | | FR-03 |
| TC-AM31 | One stop is refused | On the form | Remove a stop so only one is left → Create | The server's "Add at least two stops." reaches the screen and nothing is saved | | | FR-03 |
| TC-AM32 | A bad service time is refused | On the form | Type `25:99` as the first departure | "Enter the time as HH:MM on a 24-hour clock." and nothing is saved | | | FR-03 |
| TC-AM33 | A stop with no name or position is refused | On the form | Leave a stop's name and latitude empty → Create | Each empty field shows its own error under that stop | | | FR-03 |
| TC-AM34 | Stops can be reordered | On the form, 3 stops | Move the middle stop up | The numbers above the stops change to match, and saving keeps that order | | | FR-03 |
| TC-AM35 | Update a route | A route exists | Edit → change the name, status and fare, add a stop → Save | All the changes show on the card, and the stop count goes up by one | | | FR-03 |
| TC-AM36 | A passenger sees an activated route | A draft route exists | Set it to active, then search for it as a passenger | It is now findable; it was not while it was a draft | | | FR-03 |
| TC-AM37 | Delete a route | A route exists | Delete → confirm | The dialog names the route and its stop count; the card disappears | | | FR-03 |

## Transport Data — Members 01 and 02 (AM)
| TC-ID | What is tested | Precondition | Steps | Expected result | Actual result | Pass/Fail | Req |
|---|---|---|---|---|---|---|---|
| TC-AM38 | Switch between buses and drivers | Signed in as admin | Open Transport, tap Drivers, then Buses | The list, the search placeholder and the filter chips all change with it | | | FR-02, FR-03 |
| TC-AM39 | Read the fleet | Buses exist | Open Transport → Buses | Cards with the bus code, plate, name, model, seats, status, route and GPS id | | | FR-03 |
| TC-AM40 | Register a bus | As TC-AM39 | Register a bus → fill the fields → Register | The bus appears with a bus code the system allocated | | | FR-03 |
| TC-AM41 | A bad plate is refused | On the bus form | Type `ABC` as the plate | "Enter a plate number such as NB-1234." before anything is sent | | | FR-03 |
| TC-AM42 | Seats out of range refused | On the bus form | Type 0 seats | The field says the allowed range and nothing is saved | | | FR-03 |
| TC-AM43 | Update a bus | A bus exists | Edit → change the name and set it to maintenance → Save | Both changes show on the card | | | FR-03 |
| TC-AM44 | Delete a bus | A bus exists | Delete → confirm | The card disappears | | | FR-03 |
| TC-AM45 | Read the roster | Drivers exist | Open Transport → Drivers | Cards with the name, contact, duty status, licence class, licence number, NIC, bus and delay-report count | | | FR-02 |
| TC-AM46 | Register a driver | As TC-AM45 | Register a driver → fill the fields → Register | The driver appears, and they can sign in on the password that was set | | | FR-02 |
| TC-AM47 | The first password must be strong | On the driver form | Type `password` as the first password | The three-segment meter stays red and the form refuses to send | | | FR-02, NFR-07 |
| TC-AM48 | A bad NIC and mobile are refused | On the driver form | Type `12345` as the NIC and `0771` as the mobile | Each field says what the right form looks like | | | FR-02 |
| TC-AM49 | Update a driver | A driver exists | Edit → set them on leave and change the licence class → Save | Both changes show on the card | | | FR-02 |
| TC-AM50 | The password is not editable here | Editing a driver | Look at the form | There is no password field, and a line says a driver changes their own | | | FR-02, NFR-07 |
| TC-AM51 | Assign and unassign a bus | A driver and a free bus exist | Edit → choose a bus → Save; then edit and choose No bus | The card shows the bus, then shows none, and the bus is free again in Buses | | | FR-02, FR-03 |
| TC-AM52 | A bus already taken says so | Two drivers, one bus | Open the bus picker on the second driver | The bus is listed with the name of the driver who currently has it | | | FR-02 |
| TC-AM53 | Delete a driver | A driver exists | Delete → confirm | The dialog says the account goes too and the bus returns to the pool; the card disappears | | | FR-02 |

## States every screen must show (AM)
| TC-ID | What is tested | Precondition | Steps | Expected result | Actual result | Pass/Fail | Req |
|---|---|---|---|---|---|---|---|
| TC-AM54 | Loading | Signed in as admin | Open each of the four sections on a slow connection | Each shows its own loading message, not a blank screen | | | NFR-10 |
| TC-AM55 | Empty | Signed in as admin | Filter or search so nothing matches, in each section | Each shows an empty state saying what to do next | | | NFR-10 |
| TC-AM56 | Error and retry | Signed in as admin | Stop the API, open a section, start the API, press Retry | An error state with the server's message, and Retry loads the list | | | NFR-10 |
| TC-AM57 | Success | Signed in as admin | Save something in each section | A toast confirms each time, and the list behind it already shows the change | | | NFR-10 |

---

## Developer checks already run (localhost, not the device)

A script covered all four sections on 2026-10-09 through exactly the endpoints these screens call:
**71 assertions, all passing**. It created, read, edited, published, archived and deleted an
announcement; raised an inquiry as a throwaway passenger and then took it on, answered it, closed it
and reopened it as the admin; created a route with stops, reloaded it, replaced its stop list and
deleted it; and registered, edited, assigned, unassigned and deleted both a bus and a driver. It
also checked the refusals: an empty title, a one-stop route, an impossible service time, a malformed
plate and NIC, and zero seats. Every record it created it removed again.

The mobile side was checked by asking Metro to build the Android bundle, which compiled all eleven
screens, six components, two hooks and four services, and registered every `(admin)` route without
a resolution error. **That proves the wiring, not the behaviour** — nothing above has been seen on a
device, which is what TC-AM01 to TC-AM57 are for.
