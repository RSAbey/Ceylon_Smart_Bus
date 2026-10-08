# Deviations from Figma — Member 02 (Routes & tracking)

| Screen | Figma | Implemented | Reason |
|---|---|---|---|

## Admin Routes page

| Figma | Implemented | Reason |
|---|---|---|
| Stop rows show a name only | Name on the row, with a Details toggle revealing latitude, longitude and fare from the first stop | A stop without coordinates breaks the live map and the ETA, and without a fare the segment price cannot be worked out. The fields are hidden behind a toggle so the list stays as short as the design. |
| "3 delay reports on this route in the last 7 days (avg. 8 min)" | Same, counted for real from DELAY_REPORT rows on that route's trips in the window | Nothing is estimated; a route with no delays shows none. |
| Status: Active / Draft / Suspended | Same three, replacing the unused `active \| inactive` pair | Draft and Suspended both hide the route from passengers, so the gate is real rather than cosmetic. |
| Route list with Edit only | Edit plus Delete, with Suspend offered inside the dialog | Deleting a route with history is usually the wrong move, so the dialog steers towards Suspend and the delete confirmation says what else it removes. |

## Admin Live Fleet page

| Figma | Implemented | Reason |
|---|---|---|
| Buses on a street map | Buses plotted on a latitude/longitude chart drawn in SVG, over the stops of the routes being served | A street map needs a Google Maps (or other tile) key, and the repository ships no key and no map library for the web dashboard. The coordinates drawn are the real ones the drivers posted; only the streets are missing. The passenger and driver apps still use the real map, through `react-native-maps`. |
| Marker colour shows the service state | Marker shape as well: circle = on time, triangle = delayed, square = no signal, with a legend naming each | NFR-09: the state must not be carried by colour alone. |
| Vehicle list | Same list, plus the driver's name and mobile number | Operations staff need to call the driver of a bus that has stopped reporting. Passengers still never see the driver (NFR-08). |
| No write action on this screen | "Trips left running" strip with an End trip action | A driver app closed without ending its trip leaves the bus running forever and blocks that driver's next run, because a driver may hold only one ongoing trip. The action is refused by the server until the bus has been silent for 15 minutes, so a bus that is simply in a tunnel cannot be taken off the passenger map by mistake. |
| Static screen | Refreshes every 10 s, with a Pause control and the time of the last refresh | NFR-01 expects a position no more than 10 s old; pausing lets an administrator read the table without rows moving under the cursor. |
