# Functional test cases — Member 02 (Routes & tracking)

> **Actual result and Pass/Fail stay EMPTY until the test has really been executed** (on the APK / hosted admin).
> Cover Create, Read, Update, Delete, validation errors and wrong-role access for every interface.
> TC-ID format: `TC-<area letter><number>` (for example TC-N01). Requirement ID = FR-xx / NFR-xx.

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|

**Shared preconditions for the admin Live Fleet cases.** The API is running and `npm run seed` has
been run. Admin: `admin@ceylonsmartbus.lk`. Drivers: `sunil.driver@ceylonsmartbus.lk` (BUS-001,
route 154) and `ruwan.driver@ceylonsmartbus.lk` (BUS-002, route 138). Passenger:
`kasun.wijesinghe@example.com`. Password: `CeylonBus@2026`. "Driving" a bus means starting a trip in
the driver app and letting it post positions, or running `npm run simulate` in `server/`.

## Live Fleet, admin (L)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-L01 | Running buses are listed | Two drivers are driving | Open Live Fleet | Both buses are listed with bus code, plate, route, driver, next stop, speed, ping age and status | | | FR-02, NFR-01 |
| TC-L02 | Positions are plotted | As TC-L01 | Look at the map | One marker per bus, each labelled with its bus code, over the line of stops of its route | | | FR-02 |
| TC-L03 | Position updates by itself | As TC-L01 | Watch the page for 30 s without touching it | "Updated hh:mm:ss" changes and the markers move | | | NFR-01 |
| TC-L04 | Live updates can be paused | As TC-L01 | Press Pause live updates, wait 30 s | The timestamp stops changing and reads "live updates paused"; Resume restarts it | | | NFR-10 |
| TC-L05 | Delay is shown with its size | A driver reports a 12-minute delay from the driver app | Refresh Live Fleet | That bus reads "Delayed 12 min", its marker is a triangle, and the Running late figure is 1 | | | FR-08 |
| TC-L06 | State is not carried by colour alone | Buses in different states | Look at the map and the list | Each state has its own marker shape and is named in words in the list and the legend | | | NFR-09 |
| TC-L07 | Filter chips | Buses in at least two states | Press On time, then Delayed | Only buses in that state are listed and plotted; each chip shows its own count | | | FR-02 |
| TC-L08 | Show on map | As TC-L01 | Press Show on map on a row | That bus's marker is drawn larger with an outline | | | FR-02 |
| TC-L09 | A silent bus is honest | Start a trip in the driver app, then close the app without ending the trip | Open Live Fleet | The bus reads "Silent, trip left running", no speed or progress is shown, and it is named under the map as not plotted | | | NFR-01 |
| TC-L10 | Closing an abandoned trip | As TC-L09 | Press End trip in "Trips left running" and confirm | The trip leaves the list, Running now falls by one and the bus counts as idle again | | | FR-02 |
| TC-L11 | A running bus cannot be closed | A driver is driving and reporting positions | Call `POST /api/admin/fleet/<tripId>/end` as the admin | Refused with 409 and a message telling the admin to ask the driver to end it; the trip keeps running | | | FR-02 |
| TC-L12 | Wrong role | Signed in as a passenger or driver | Call `GET /api/admin/fleet` | Refused with 403 | | | NFR-08 |
| TC-L13 | Empty state | No driver is driving | Open Live Fleet | "No bus is reporting a position right now" over the map and "No bus matches" in the list, with no error | | | NFR-10 |
| TC-L14 | API is unreachable | Stop the API | Open Live Fleet | The list shows the error state with a Retry button, not a blank page | | | NFR-10 |
