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
| Buses on a street map | The same, on a real street map: Leaflet with OpenStreetMap tiles | Built first as a plain latitude/longitude plot because a street map was assumed to need a paid key. Leaflet with OpenStreetMap tiles needs no key and no account, so the dashboard now draws the real roads and the repository still ships no secret. Attribution is required by the tile policy and Leaflet prints it in the corner. |
| Marker colour shows the service state | Marker shape as well: circle = on time, triangle = delayed, square = no signal, with a legend naming each | NFR-09: the state must not be carried by colour alone. |
| Vehicle list | Same list, plus the driver's name and mobile number | Operations staff need to call the driver of a bus that has stopped reporting. Passengers still never see the driver (NFR-08). |
| No write action on this screen | "Trips left running" strip with an End trip action | A driver app closed without ending its trip leaves the bus running forever and blocks that driver's next run, because a driver may hold only one ongoing trip. The action is refused by the server until the bus has been silent for 15 minutes, so a bus that is simply in a tunnel cannot be taken off the passenger map by mistake. |
| Static screen | Refreshes every 10 s, with a Pause control and the time of the last refresh | NFR-01 expects a position no more than 10 s old; pausing lets an administrator read the table without rows moving under the cursor. |

## Live tracking maps in the mobile app

| Planned | Implemented | Reason |
|---|---|---|
| `react-native-maps` with Google Maps (driver Live screen, passenger live tracking) | Leaflet over OpenStreetMap tiles, inside a `react-native-webview` | Google Maps on Android only draws once an API key is compiled into the app. Expo Go ignores that key whatever is in `.env`, so the map was a black box with the Google logo on every device the team could test on, and a development build was not practical before the deadline. OpenStreetMap needs no key and no account. The admin dashboard already draws its fleet map this way, so the two agree. |
| Map recentres on the bus on every update | The route is fitted once, then only the bus marker moves | The screens passed `region` to `MapView`, so every position (every 5 s) snapped the camera back and the rider could not pan away. |
| — | The map says so when it cannot load | Leaflet and the tiles come over the network. If they fail the screen shows one honest line and the stops, ETA and status below it still work, instead of a blank rectangle. |

**Switching back to Google Maps**, if a key and a development build become available: `npx expo install react-native-maps`, restore the two map blocks from git history (commit before this one), and put `android.config.googleMaps.apiKey` back in `app.config.js` reading `GOOGLE_MAPS_API_KEY`.

## The admin area of the mobile app

Four of the dashboard's management sections were rebuilt inside the mobile app against the same
API, one of them this member's. What was built, and every way the phone version differs from the
dashboard, is written up once in **`docs/evidence/admin-mobile-app.md`** rather than repeated in
each member's file. Test cases: `docs/testing/functional/admin-mobile.md`.
