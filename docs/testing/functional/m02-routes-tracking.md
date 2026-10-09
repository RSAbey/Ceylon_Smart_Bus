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

## Live tracking map, mobile (M)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-M01 | Driver map draws | Driver on a trip, device online | Driver app → Live | A street map with the route line, its stops and the bus marker — not a blank or black box | | | FR-02 |
| TC-M02 | The map follows the bus | As TC-M01, bus moving | Watch for a minute | The bus marker moves; the map does not snap back while you are panning | | | FR-02, NFR-01 |
| TC-M03 | Current stop stands out | As TC-M01 | Look at the stop the bus has just reached | It is drawn larger and in the secondary colour, and its name shows when tapped | | | FR-02 |
| TC-M04 | Passenger map draws | A bus running on a route | Passenger app → track that bus | The same map with the route, the stops and the bus | | | FR-02 |
| TC-M05 | No connection | Turn the device's data off | Open the map | One line saying the map could not load; the stops, ETA and status below it still show | | | NFR-05 |
| TC-M06 | Attribution | As TC-M01 | Look at the corner of the map | "© OpenStreetMap contributors" is visible, as the tile licence requires | | | NFR-07 |

## Live Fleet, admin (L)

| TC-ID | Feature | Preconditions | Steps | Expected result | Actual result | Pass/Fail | Requirement ID |
|---|---|---|---|---|---|---|---|
| TC-L01 | Running buses are listed | Two drivers are driving | Open Live Fleet | Both buses are listed with bus code, plate, route, driver, next stop, speed, ping age and status | | | FR-02, NFR-01 |
| TC-L02 | Positions are plotted | As TC-L01 | Look at the map | A street map with one marker per bus over the line of stops of its route; hovering a marker names the bus and its state | | | FR-02 |
| TC-L02b | The map is a real map | As TC-L01 | Look at the map background and its corner | Streets and place names are drawn, with the OpenStreetMap attribution in the corner | | | FR-02 |
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
