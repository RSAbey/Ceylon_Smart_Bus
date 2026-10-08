# Functional test cases — Member 03 (Tickets, seats & inquiries)

> **Actual result and Pass/Fail stay EMPTY until the test has really been executed** (on the APK / hosted admin).
> Cover Create, Read, Update, Delete, validation errors and wrong-role access for every interface.
> TC-ID format: `TC-<area letter><number>` (for example TC-N01). Requirement ID = FR-xx / NFR-xx.

**Shared preconditions.** The API is running, `npm run seed` has been run, and a driver (`sunil.driver@ceylonsmartbus.lk`)
has started a trip so a bus is in service. Passenger account: `kasun.wijesinghe@example.com`. Demo password:
`CeylonBus@2026`. "Second passenger" means `tharushi.fernando@example.com`.

## Tickets (T)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-T01 | Book a ticket | A bus is running on route 138 | Route Details → Buy a ticket → choose boarding and alighting stops → Choose a seat → tap a free seat → Confirm and pay | Ticket is created with a `CSB-nnnnnn` code, the chosen seat is held, and the Payment screen opens | | | FR-06 |
| TC-T02 | Fare is priced by the server | TC-T01 done | Compare the fare shown with the two stops' `fareFromOrigin` difference | The fare equals the difference, not the route's base fare | | | FR-06 |
| TC-T03 | Reversed journey refused | On Book a Ticket | Choose a boarding stop that comes *after* the alighting stop | The warning "This bus reaches your boarding stop after your destination" appears and Choose a seat stays disabled | | | FR-06 |
| TC-T04 | View my tickets | At least one ticket exists | Open My Tickets | Tickets are listed newest first with route, stops, seat, fare and a status badge | | | FR-05 |
| TC-T05 | Status tabs filter | Tickets exist in two states | Tap Active, then Used, then Cancelled | Each tab lists only tickets in that state | | | FR-05 |
| TC-T06 | Edit an active ticket | An unused ticket exists | Ticket → Change → pick a different alighting stop → Save changes | The ticket is updated and the fare is repriced for the new journey | | | FR-05 |
| TC-T07 | Change seat | An unused ticket exists | Ticket → Change → Change my seat instead → tap a free seat → Move to this seat | The ticket moves to the new seat and the old seat becomes available again | | | FR-06 |
| TC-T08 | Cancel a ticket | A paid, unused ticket exists | Ticket → Cancel → confirm | Status becomes Cancelled, the seat is released and the payment reads Refunded | | | FR-05 |
| TC-T09 | A used ticket is frozen | A ticket has been verified by a driver | Ticket → try Change, then Cancel | Both are refused with "A used ticket can no longer be changed" / "already been used on the bus" | | | FR-05, NFR-07 |
| TC-T10 | Another passenger's ticket | Note a ticket id from passenger A | Sign in as the second passenger and request that ticket id | 403 "You can only view your own tickets" | | | NFR-08 |

## Seats (S)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-S01 | Seat map loads | A bus is running | Open Choose a Seat for that trip | Seats are drawn four to a row (2 + 2) and the count of free seats matches the bus capacity minus bookings | | | FR-06 |
| TC-S02 | Taken seats are not tappable | One seat is already booked | Tap the booked seat | Nothing happens; the seat shows as Taken in the legend and in its accessibility label | | | FR-06, NFR-09 |
| TC-S03 | Double booking refused | Two passengers, one free seat | Both choose the same seat; the second confirms after the first | The second gets "Seat *n* has just been taken. Please pick another." and the map refreshes | | | FR-06 |
| TC-S04 | Non-existent seat refused | — | Send `POST /api/tickets` with `seatNumber: "99Z"` | 422 "Seat 99Z does not exist on this bus." | | | FR-06 |
| TC-S05 | Full bus | Every seat booked | Open the seat map | The empty state "Every seat on this bus is taken" with a way back | | | FR-06 |

## Payments (P)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-P01 | Pay a fare | An unpaid ticket exists | Payment → choose Card → Pay | Payment succeeds, the ticket reads Paid and the QR code appears | | | FR-07 |
| TC-P02 | Method required | On Payment | Tap Pay without choosing a method | The Pay button is disabled until a method is chosen | | | FR-07 |
| TC-P03 | Paying twice refused | A paid ticket exists | Send a second `POST /api/payments` for the same ticket | 409 "This ticket is already paid for." | | | FR-07 |
| TC-P04 | Payment history | At least one payment exists | Profile → Payment Methods | The accepted methods are listed, then the passenger's own payments with Paid / Refunded badges | | | FR-07 |
| TC-P05 | No card details collected | — | Inspect the Payment screen and the request body | Only `ticketId` and `method` are sent; no card number field exists anywhere | | | NFR-07 |
| TC-P06 | Admin finance report | Payments and a refund exist | Admin dashboard → Finance | Collected and refunded totals, totals per method, and recent transactions with ticket code and route | | | FR-10 |
| TC-P07 | Driver cannot open finance | Signed in as a driver | Request `GET /api/admin/finance` | 403 | | | NFR-08 |

## Verification (V)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-V01 | Scan a valid ticket | Driver on a trip; passenger holds a paid ticket for that bus | Verify Ticket → Scan QR → point at the passenger's QR | Green "Valid ticket" with passenger name, stops, seat and fare | | | FR-09 |
| TC-V02 | Typed code fallback | Same | Verify Ticket → Type code → enter the `CSB-` code → Check this ticket | Same valid result as the scan | | | FR-09, NFR-06 |
| TC-V03 | Reuse refused | TC-V01 done | Check the same ticket again | "This ticket has already been used." | | | NFR-07 |
| TC-V04 | Unpaid ticket refused | A booked but unpaid ticket | Check its code | "The fare for this ticket has not been paid." | | | FR-09 |
| TC-V05 | Tampered QR refused | A paid ticket | Send `POST /api/verification` with the right `ticketKey` but a wrong `qrSignature` | "This QR code has been tampered with." | | | NFR-07 |
| TC-V06 | Wrong bus refused | A ticket for another trip | Check it on this driver's trip | "This ticket is for a different bus." | | | FR-09 |
| TC-V07 | Unknown code | — | Check `CSB-000000` | "No ticket exists with that code." | | | FR-09 |
| TC-V08 | Trip required | Driver has not started a trip | Open Verify Ticket and check any code | 409 "Start your trip before checking tickets" | | | FR-09 |
| TC-V09 | Passenger cannot verify | Signed in as a passenger | Request `POST /api/verification` | 403 | | | NFR-08 |
| TC-V10 | Camera refused | Camera permission denied | Open Verify Ticket | The screen explains the camera is off and the Type code tab still works | | | NFR-06 |
| TC-V11 | Recent checks | Two checks done | Scroll under the scanner | Both checks are listed with Scanned / Typed, the time and a Valid / Invalid badge | | | FR-09 |
| TC-V12 | The camera preview really appears | Camera permission granted, on an Android device | Open Verify Ticket | The live camera picture fills the frame behind the orange corner marks, not a dark panel | | | FR-09, NFR-06 |
| TC-V13 | The camera is released | On Verify Ticket | Switch to another tab and back | The preview comes back live, not black | | | FR-09 |
| TC-S07 | Driver seat map opens | Driver on a trip with a booking | Bookings → Open the seat map | The seat map opens and stays open; it does not bounce back to the driver home | | | FR-06 |
| TC-S08 | Driver seat map is read only | As TC-S07 | Tap a free seat | Nothing is selected and no ticket flow starts; taken seats carry a cross as well as their colour | | | FR-06, NFR-09 |
| TC-S09 | Driver seat map counts | As TC-S07 | Compare the header with the Bookings list | "x of y seats taken" matches the seats reserved on that trip | | | FR-06 |

## Inquiries (I)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-I01 | Raise an inquiry | Signed in | Support → Write an inquiry → fill subject, tag, priority, message → Send | The inquiry is created and appears in the list as Open | | | FR-08 |
| TC-I02 | Short message refused | On the form | Enter a message under 10 characters → Send | The field shows "Describe the issue in at least 10 characters" and nothing is sent | | | FR-08 |
| TC-I03 | Tag required | On the form | Leave the tag unchosen → Send | "Choose what the inquiry is about." is shown under the tag pills | | | FR-08 |
| TC-I04 | Edit inside the window | An inquiry raised under 5 minutes ago | Open it → Edit → change the message → Save | The inquiry is updated | | | FR-08 |
| TC-I05 | Edit after the window | An inquiry older than 5 minutes | Open it | Edit and Delete are gone, replaced by the note that the window has passed | | | FR-08 |
| TC-I06 | Delete inside the window | A fresh inquiry | Open it → Delete → confirm | The inquiry disappears from the list | | | FR-08 |
| TC-I07 | Another user's inquiry | Note an inquiry id from passenger A | Sign in as the second passenger and request that id | 403 "You can only open your own inquiries" | | | NFR-08 |
| TC-I08 | Admin inbox | Inquiries exist | Admin dashboard → Inquiries | All inquiries with author, tag, priority and reply count | | | FR-08 |
| TC-I09 | Admin reply | An open inquiry | Reply to it | Status becomes Replied, the reply shows in the passenger's app and a notification arrives | | | FR-08 |
| TC-I10 | Frozen after a reply | TC-I09 done | As the passenger, try to edit it | 409 "This inquiry is replied and can no longer be edited" | | | FR-08 |
| TC-I11 | Close an inquiry | A replied inquiry | Admin → Close | Status becomes Closed | | | FR-08 |
| TC-I12 | Passenger cannot open the inbox | Signed in as a passenger | Request `GET /api/admin/inquiries` | 403 | | | NFR-08 |
| TC-I13 | Inbox counts | Inquiries in more than one state | Open the inbox | Open, Replied, Unassigned and High priority are counted above the table, and the chips carry their own counts | | | FR-08, FR-10 |
| TC-I14 | Counts ignore the filter | As TC-I13 | Type a search that matches one inquiry | The table narrows but the four figures and the chip counts still describe the whole inbox | | | FR-10 |
| TC-I15 | Search | Inquiries exist | Search for words in a subject | Only inquiries whose subject or message contains them are listed | | | FR-08 |
| TC-I16 | Dropdown filters | Inquiries of several tags and priorities | Choose a tag, then a priority | Only matching inquiries are listed | | | FR-08 |
| TC-I17 | Unassigned queue | An unassigned inquiry exists | Choose "Nobody yet" in the assignee filter | Only inquiries nobody has picked up are listed | | | FR-08 |
| TC-I18 | Assign | An open inquiry | Open it and choose an administrator | A toast confirms it, the row shows that name and the Unassigned figure falls by one | | | FR-08 |
| TC-I19 | Assignment is admin-only | Note a passenger's user id | Call the assignee endpoint with it | 422 "That account is not an administrator" | | | NFR-08 |
| TC-I20 | Waiting time | An inquiry raised over 24 hours ago with no reply | Look at its row | The Waiting column names it in words as having no answer yet, not by colour alone | | | FR-08, NFR-09 |
| TC-I21 | Conversation | An inquiry with a reply | Open it | The passenger's message and each reply are shown in order, every one with its author and time | | | FR-08 |
| TC-I22 | Short reply refused | An open inquiry | Type fewer than 10 characters and send | The field explains the length and nothing is sent | | | FR-08 |
| TC-I23 | Closed cannot be answered | A closed inquiry | Open it | The reply box is replaced by a note and Send reply is disabled | | | FR-08 |
| TC-I24 | Reopen | A closed inquiry | Press Reopen | Status returns to Open, the reply box comes back and a reply can be sent | | | FR-08 |
| TC-I25 | Reopen an open inquiry | An open inquiry | Call the reopen endpoint | 409 "This inquiry is already open" | | | FR-08 |

## Tickets & Finance, admin (F)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-F01 | Takings load | Seeded payments exist | Open Tickets & Finance | Collected, refunded, average fare and failed payments are shown for the last 7 days | | | FR-10 |
| TC-F02 | Period changes the figures | As TC-F01 | Press Today, then All time | Every figure, the fare table takings and the transaction list change with the period | | | FR-10 |
| TC-F03 | Method split | Fares paid by card and by wallet exist | Look at "How passengers paid" | One line per method with its count and total, adding up to Collected | | | FR-10 |
| TC-F04 | Takings trend | As TC-F01 | Look at the trend | Seven bars, oldest first, each labelled with its day and its amount in rupees | | | FR-10 |
| TC-F05 | Fares by route | Routes exist | Look at the fare table | Every route is listed with its base fare, per-km rate, end-to-end fare, fares paid and takings, including routes that sold nothing | | | FR-10, NFR-10 |
| TC-F06 | Fare revision preview | As TC-F05 | Press Adjust fares on a route, type 10 | The dialog says what the end-to-end fare becomes before anything is saved | | | NFR-10 |
| TC-F07 | Fare revision saves | As TC-F06 | Press Save fares | A toast names how many stop fares were revised and the table shows the new end-to-end fare | | | NFR-10 |
| TC-F08 | A revision reaches passengers | A route repriced by TC-F07 | Search that journey in the passenger app | The quoted fare is the revised one | | | FR-04, NFR-10 |
| TC-F09 | A revision is bounded | As TC-F05 | Enter 500 in the revision field and save | Refused with a message naming the allowed range; fares are unchanged | | | NFR-10 |
| TC-F10 | Refund is offered only where it applies | Paid and refunded transactions exist | Look at the transaction list | Refund appears on paid rows only | | | FR-05 |
| TC-F11 | Refund explains itself | A paid fare on an active ticket | Press Refund | The dialog names the amount, the ticket, the passenger, where the money goes and what happens to the seat | | | FR-05, NFR-10 |
| TC-F12 | Refund a wallet fare | A fare paid from the wallet on an active ticket | Confirm the refund, then open the passenger's wallet | The payment reads Refunded, the ticket is cancelled, the seat is free again and the wallet balance has risen by the fare | | | FR-05, FR-07 |
| TC-F13 | The passenger is told | As TC-F12 | Open Alerts in the passenger app | A "Fare refunded" alert naming the ticket and the amount | | | FR-03, FR-07 |
| TC-F14 | Refunding twice | An already refunded fare | Call the refund endpoint again | Refused with 409 | | | FR-05 |
| TC-F15 | Status filter | Transactions of more than one status | Press Refunded | Only refunded transactions are listed, and no Refund buttons are offered | | | FR-10 |
| TC-F16 | Wrong role | Signed in as a passenger or driver | Request `GET /api/admin/finance` | 403 | | | NFR-08 |
| TC-F17 | API is unreachable | Stop the API | Open Tickets & Finance | The page shows one error state with a Retry button, not blank figures | | | NFR-10 |

## Development checks already run (not a substitute for the table above)

The API behind these cases was exercised with a throwaway script against the development server and MongoDB Atlas on
2026-10-07: **61 assertions, all passing**, covering booking, segment fares, the double-booking guard, ownership
(403s), the unpaid and reused refusals, the tampered-signature refusal, refund-on-cancel, seat release, the inquiry
edit window, the admin reply and the finance totals. The Android bundle also builds (`npx expo export`).

A second script covered the finance screen on 2026-10-08: **50 assertions, all passing**, covering the period and
status filters, the summary shape, a fare revision from the dialog through to the fare a passenger is quoted, and a
refund through to the wallet balance, the cancelled ticket, the released seat and the passenger's alert.

A third script covered the inquiry inbox on 2026-10-08: **42 assertions, all passing**, covering the counts and
every filter, assigning (including the refusal to assign to someone who is not an administrator), replying through
to the passenger's own thread and alert, and closing, reopening and the refusals around both.

That is a developer check on localhost, **not** the device testing this table records. Every Actual / Pass-Fail cell
above stays empty until the case is run on the APK and the hosted admin dashboard.
