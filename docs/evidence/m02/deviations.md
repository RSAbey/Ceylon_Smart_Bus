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
