# Ceylon Smart Bus — Developer Guide (WE-133)

Read this before writing any code. It is also the evidence for "Implementation & Fidelity" in the report.

---

## 1. One-time setup

```bash
git clone https://github.com/<org>/ceylon-smart-bus.git
cd ceylon-smart-bus
git checkout develop
git checkout -b feature/mXX-<your-area>     # use YOUR branch name

# API
cd server && cp .env.example .env           # fill MONGODB_URI, JWT_SECRET
npm install && npm run seed && npm run dev  # http://localhost:5000

# Admin dashboard
cd ../admin && cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
npm install && npm run dev                  # http://localhost:5173

# Mobile
cd ../mobile && cp .env.example .env        # EXPO_PUBLIC_API_URL=http://<YOUR-LAPTOP-LAN-IP>:5000/api
npm install && npx expo start               # scan QR with Expo Go, or press 'a' for emulator
```
Use your laptop's **LAN IP** (not `localhost`) for the phone; phone and laptop must be on the same Wi-Fi.
Seed accounts are printed by `npm run seed` (passenger, driver, admin).

## 2. Daily Git routine
1. Morning: `git fetch && git merge origin/develop` into your branch.
2. Commit small: `feat(<area>): ...`, `fix(<area>): ...`.
3. Evening: push your branch. When a slice works → open a **PR into `develop`** with the template ticked.
4. Never push directly to `main` or `develop`. Never edit another member's feature folder.

## 3. The golden rules

| Rule | Detail |
|---|---|
| Stay in your lane | Edit only your `features/`, `modules/`, `pages/` folders |
| Reuse the design system | Colours, fonts, spacing, buttons, header, nav come from `src/theme` and `src/components`; never hard-code `#1E75D5` etc. in a screen |
| Match Figma | Compare each screen with the Figma frame; write any deviation in the PR |
| Every screen has 4 states | loading · empty · error · success (use `LoadingState`, `EmptyState`, `ErrorState`, `ToastMessage`) |
| ≥ 2 CRUD per interface | Make sure they really work end-to-end and persist in MongoDB |
| Clean code | See §4 |
| Secrets | Only in `.env`; never committed |

## 4. Clean code standard

### 4.1 Naming — NO generic names
Every name must say **what the thing is**. Banned as variable/function names:

`data, temp, tmp, res, resp, response (alone), result, item, items, obj, val, value, arr, list, info, stuff, thing, x, y, a, b, c, foo, bar, test, test1, handle, handleClick, handleSubmit, onPress (alone), flag, num, str, e (except `error` in catch), cb, fn, args`

| ❌ Bad | ✅ Good |
|---|---|
| `data` | `unreadNotifications` |
| `const res = await api.get(...)` | `const delayReportsResponse = await apiClient.get('/delays/mine')` |
| `items.map(item => ...)` | `notifications.map(notification => ...)` |
| `handleSubmit` | `submitDelayReport` |
| `handleClick` | `dismissNotification` |
| `flag` | `isDelayFormSubmitting` |
| `list` | `recentSearchHistory` |
| `temp` | `adjustedArrivalMinutes` |
| `const [a, setA] = useState()` | `const [selectedDelayReason, setSelectedDelayReason] = useState(null)` |

Conventions: components `PascalCase`; functions/variables `camelCase` starting with a **verb** for functions (`fetchNotifications`, `markAllAsRead`);
booleans start with `is/has/can/should`; constants `UPPER_SNAKE_CASE` in `utils/constants.js`; files named after their export (`NotificationCard.js`);
API routes plural nouns (`/notifications`), DB fields `camelCase`.

### 4.2 No junk
- No unused imports, variables, props, files, or dependencies.
- No commented-out code. Delete it — Git remembers.
- No `console.log` left in committed code.
- No placeholder text such as "lorem ipsum", "test123", "asdf" — use realistic content (e.g. "Bus 154 · Malabe → Pettah").
- No copy-pasted blocks: if you paste the same code three times, make a function/component.
- No magic numbers/strings: `MAX_DELAY_MINUTES = 180`, not `180` scattered around.
- No `TODO` left in the final branch.

### 4.3 Comments (clear, short, useful)
- **Every file starts with a one-line purpose comment.**
- **Every function gets a JSDoc block**: what it does, params, returns.
- Inside functions, comment the **why** (business rule, edge case), not the obvious *what*.

```js
/**
 * Marks every unread notification of the signed-in passenger as read.
 * @param {string} passengerUserId - Id of the authenticated passenger.
 * @returns {Promise<number>} How many notifications were updated.
 */
async function markAllNotificationsAsRead(passengerUserId) {
  // Only touch unread rows so updatedAt is not changed needlessly.
  const updateSummary = await Notification.updateMany(
    { userId: passengerUserId, isRead: false },
    { $set: { isRead: true } }
  );
  return updateSummary.modifiedCount;
}
```

### 4.4 Structure
- Backend layering: `routes` (URL + middleware) → `controller` (HTTP in/out only) → `service` (business rules) → `model` (schema). **No business logic in controllers or routes.**
- Frontend: screens compose components; API calls live in `features/<name>/services`, never inside JSX.
- Functions do **one thing** and stay under ~40 lines.
- Validate input on the server (never trust the client) and on the form.
- Consistent API envelope: `{ "success": true, "message": "...", "data": {...} }` / `{ "success": false, "message": "...", "errors": [...] }`.

## 5. Mobile navigation — how to add the nav bar, header and menu

Design source: `docs/design/Navigation_Components.png` (header 64 px, 16 px side insets, ≥44 px touch targets,
5-destination bottom nav with icon + label + active indicator, slide-out menu with destructive Logout).

### 5.1 Bottom navigation (Expo Router tabs + custom bar)

`mobile/app/(passenger)/(tabs)/_layout.js`
```jsx
// Passenger bottom navigation: Home · Explore · Tickets · Alerts · Profile.
import { Tabs } from 'expo-router';
import BottomTabBar from '../../../src/components/navigation/BottomTabBar';

export default function PassengerTabsLayout() {
  return (
    <Tabs tabBar={(tabBarProps) => <BottomTabBar {...tabBarProps} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="tickets" options={{ title: 'Tickets' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

`mobile/src/components/navigation/BottomTabBar.js` — configuration-driven (icons + labels in one array):
```jsx
// Custom bottom tab bar matching the Figma "Bottom Navigation" component.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

const PASSENGER_TAB_ICONS = {
  home: 'home-outline',
  explore: 'compass-outline',
  tickets: 'ticket-outline',
  alerts: 'notifications-outline',
  profile: 'person-outline',
};

export default function BottomTabBar({ state, descriptors, navigation, unreadAlertCount = 0 }) {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: safeAreaInsets.bottom }]}>
      {state.routes.map((tabRoute, tabIndex) => {
        const isTabActive = state.index === tabIndex;
        const tabLabel = descriptors[tabRoute.key].options.title;
        const tabColor = isTabActive ? colors.primary[600] : colors.text.disabled;

        const openTab = () => {
          const tabPressEvent = navigation.emit({ type: 'tabPress', target: tabRoute.key, canPreventDefault: true });
          if (!isTabActive && !tabPressEvent.defaultPrevented) navigation.navigate(tabRoute.name);
        };

        return (
          <Pressable key={tabRoute.key} onPress={openTab} style={styles.tabItem}
            accessibilityRole="button" accessibilityLabel={tabLabel} accessibilityState={{ selected: isTabActive }}>
            {isTabActive && <View style={styles.activeIndicator} />}
            <Ionicons name={PASSENGER_TAB_ICONS[tabRoute.name]} size={22} color={tabColor} />
            <Text style={[typography.caption, { color: tabColor }]}>{tabLabel}</Text>
            {tabRoute.name === 'alerts' && unreadAlertCount > 0 && <View style={styles.unreadDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  tabItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  activeIndicator: { position: 'absolute', top: 0, width: 24, height: 3, borderRadius: 2, backgroundColor: colors.primary[600] },
  unreadDot: { position: 'absolute', top: 8, right: '30%', width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary[500] },
});
```
> Unread badge: Member 04's `useUnreadNotificationCount()` hook supplies `unreadAlertCount`. Driver tabs (`Dashboard · Trip · Verify · Delay · Profile`) reuse the same component with a different icon map — pass it as a prop instead of copying the file.

**To add a new tab:** (1) add the route file in `app/(passenger)/(tabs)/`, (2) add a `<Tabs.Screen>`, (3) add its icon to the icon map. Nothing else.

### 5.2 Header (4 variants from Figma: standard · back · search · tracking)
```jsx
// Usage on any screen — pick the variant, never rebuild the header.
<AppHeader variant="back" title="My Tickets" onMenuPress={openDrawerMenu} />
<AppHeader variant="standard" unreadAlertCount={3} onAlertsPress={openAlertsTab} onProfilePress={openProfileTab} />
```
Rule from the design: **one leading navigation pattern and at most two trailing actions.**

### 5.3 Drawer menu
`DrawerMenu` is a modal slide-in (no extra native libraries) with the menu entries defined in **one array**:
```js
// mobile/src/components/navigation/drawerMenuItems.js
export const DRAWER_MENU_ITEMS = [
  { key: 'home',    label: 'Home',              icon: 'home-outline',          route: '/(passenger)/(tabs)/home' },
  { key: 'explore', label: 'Explore Routes',    icon: 'git-network-outline',   route: '/(passenger)/(tabs)/explore' },
  { key: 'tracking',label: 'Live Bus Tracking', icon: 'location-outline',      route: '/(passenger)/live-tracking' },
  { key: 'tickets', label: 'My Tickets',        icon: 'ticket-outline',        route: '/(passenger)/(tabs)/tickets' },
  { key: 'alerts',  label: 'Alerts',            icon: 'notifications-outline', route: '/(passenger)/(tabs)/alerts' },
  { key: 'history', label: 'Travel History',    icon: 'time-outline',          route: '/(passenger)/travel-history' },
  { key: 'settings',label: 'Settings',          icon: 'settings-outline',      route: '/(passenger)/settings' },
  { key: 'help',    label: 'Help & Support',    icon: 'help-circle-outline',   route: '/(passenger)/inquiries' },
];
// Logout is rendered separately with the destructive (red) style — never inside this array.
```
**To add a menu item:** add one object to the array and create its route file.

## 6. Admin dashboard — how to add the sidebar and a page

Menu is **one config file**: `admin/src/config/navigationItems.js`
```js
// Sidebar entries. Add a page by adding one object here and one <Route> in App.jsx.
export const ADMIN_NAVIGATION_ITEMS = [
  { key: 'overview',      label: 'Overview',          path: '/',               iconName: 'LayoutDashboard' },
  { key: 'fleet',         label: 'Live Fleet',        path: '/fleet',          iconName: 'MapPin' },
  { key: 'routes',        label: 'Routes & Buses',    path: '/routes',         iconName: 'Route' },
  { key: 'drivers',       label: 'Drivers',           path: '/drivers',        iconName: 'IdCard' },
  { key: 'delays',        label: 'Delays',            path: '/delays',         iconName: 'Clock' },
  { key: 'finance',       label: 'Tickets & Finance', path: '/finance',        iconName: 'Wallet' },
  { key: 'inquiries',     label: 'Inquiries',         path: '/inquiries',      iconName: 'MessageSquare' },
  { key: 'announcements', label: 'Announcements',     path: '/announcements',  iconName: 'Megaphone' },
  { key: 'performance',   label: 'Performance',       path: '/performance',    iconName: 'BarChart3' },
];
```
`Sidebar.jsx` maps this array to `NavLink`s (active style = `--primary-100` background + `--primary-600` text, per the palette).
Every page is rendered inside `AdminLayout` (sidebar + `TopBar` + `PageHeader`):

```jsx
// admin/src/pages/delays/DelaysPage.jsx
import PageHeader from '../../components/layout/PageHeader';
export default function DelaysPage() {
  return (
    <>
      <PageHeader title="Delay Reports" subtitle="Review, acknowledge and resolve driver-reported delays" />
      {/* table component here */}
    </>
  );
}
```
Steps: (1) create `pages/<area>/<Name>Page.jsx`, (2) add an object to `ADMIN_NAVIGATION_ITEMS`, (3) add `<Route path="/delays" element={<DelaysPage />} />` inside the protected layout route in `App.jsx`.

Admin design rules: stat cards first (Statistics-First variant), then tables; same colour tokens as mobile via `theme/tokens.css`; tables have loading skeleton, empty and error states; destructive actions use `ConfirmDialog`.

## 7. How to build a feature (vertical-slice checklist)

1. **Model** (`modules/<x>/<x>.model.js`) — fields exactly as in the ERD; add the unique indexes.
2. **Service** — business rules + DB calls. **Controller** — parse request, call service, send envelope. **Routes** — URL + `authenticateToken` + `authorizeRoles(...)`.
3. Test in Postman/Thunder Client (happy path + invalid input + wrong role).
4. **Mobile/admin service file** (`features/<x>/services`) — API calls only.
5. **Screen** — compose shared components; add loading/empty/error/success states.
6. Wire the route file (already stubbed) and nav entry.
7. Check against Figma; take a "Figma vs app" screenshot pair.
8. Write test cases (ID, steps, expected, linked requirement) in `docs/testing/`.
9. Open PR with checklist.

## 8. Cross-member contracts (do not break these)

| Contract | Provider | Consumers |
|---|---|---|
| `authenticateToken`, `authorizeRoles('passenger'\|'driver'\|'admin')` | M01 | all |
| `req.user = { userId, role }` after authentication | M01 | all |
| `notificationService.createNotification(...)` | M04 | M02 (approaching), M03 (ticket, payment, inquiry reply) |
| `delayService.getActiveDelayMinutes(tripId)` | M04 | M02 ETA calculation |
| `tripService.getOngoingTripForDriver(driverId)` | M02 | M03, M04 |
| `ticketService.getActiveTicketHolderIds(tripId)` | M03 | M04 (delay notification recipients) |
| `savedRouteService.getUserIdsBySavedRoute(routeId)` | M02 | M04 |
| `apiClient` (adds JWT, normalises errors) | M04 foundation | all mobile code |

If you change a signature, tell the group chat **before** merging.

## 9. Testing & evidence (needed for 5 marks)
- **Functional test case format:** `TC-ID · Feature · Preconditions · Steps · Expected · Actual · Pass/Fail · Requirement ID`.
- Cover **Create, Read, Update, Delete** for every interface, plus validation errors and wrong-role access.
- **Usability:** ≥ 5 real/proxy users on the **built APK / hosted admin**, tasks per flow, record sessions (with consent), log issues as High/Medium/Low, then **fix some and record the fix**.
- Never write results before running the tests. Examiners compare the log with the demo.

## 10. Build & release

### Android APK, built on this laptop (no account, no cloud)
Needs the Android SDK (Android Studio installs it) and **JDK 17 or 21**. `mobile/android/` is
generated and git-ignored, so it is rebuilt from `app.config.js` rather than edited by hand.

> **Use JDK 17 or 21, not 24 or newer.** On JDK 24+ the native build steps fail with
> `Execution failed for task ':react-native-screens:configureCMakeRelWithDebInfo[arm64-v8a]'` and
> the single line `WARNING: A restricted method in java.lang.System has been called`. That warning
> is not the real problem in itself — the Android Gradle plugin treats anything the CMake step
> writes to stderr as a failure, and JDK 24 restricted the native access those tools use. It costs
> 25 minutes to find out, because it fails late. Point `JAVA_HOME` at a JDK 21 for the build:
> ```bash
> export JAVA_HOME="/c/Program Files/Java/jdk-21"   # PowerShell: $env:JAVA_HOME="C:\Program Files\Java\jdk-21"
> ```

> **Build from a short path on Windows.** The C++ parts of `react-native-screens` and
> `react-native-worklets` fail when the repository sits somewhere deep. What ninja prints is
> `ninja: error: manifest 'build.ninja' still dirty after 100 tries`, but the real reason is further
> up the log: `The object file directory ... has 204 characters. The maximum full path to an object
> file is 250 characters`. Windows cannot write the object files, so CMake regenerates for ever and
> ninja gives up. A path such as `E:\Documents\University\3rd Year\...\Ceylon_Smart_Bus` is already
> too deep before `node_modules` is added to it.
>
> **The clone has to actually be at a short path. An alias does not work** — this was tried and it
> does not, so do not spend an evening on it:
> - A **junction** (`New-Item -ItemType Junction`) is a reparse point. Gradle keeps the short path,
>   but Node resolves its own files back to the real one, and bundling dies with
>   `this and base files have different roots`.
> - A **`subst` drive** survives `fs.realpath` and Java's `getCanonicalPath`, so it looks promising —
>   but `expo-modules-autolinking` writes the *real* path of every native module into
>   `mobile/android/build/generated/autolinking/autolinking.json`, and CMake follows what is written
>   there whatever drive Gradle was run from. The long path comes straight back.
>
> So: `git clone` into `C:\dev\Ceylon_Smart_Bus` (or move the folder there) and build from there.
>
> If you do change path, delete the generated output first, or nothing changes:
> ```bash
> rm -rf mobile/android/build mobile/android/app/build mobile/android/.gradle
> rm -rf mobile/node_modules/*/android/.cxx
> ```
>
> Building on EAS avoids all of this, because it builds on Linux where these limits do not exist.

The whole recipe, from a clone that is already at a short path:
```bash
# 1. a JDK the Android plugin accepts
export JAVA_HOME="/c/Program Files/Java/jdk-21"

# 2. generate android/ from app.config.js
cd mobile
npm install
npx expo prebuild --platform android --clean

# 3. tell Gradle where the SDK is (once, and again after every --clean)
echo "sdk.dir=C:/Users/<you>/AppData/Local/Android/Sdk" > android/local.properties

# 4. build, with the API address baked in
cd android
EXPO_PUBLIC_API_URL="https://<your-api>.vercel.app/api" ./gradlew assembleRelease

# the APK lands in mobile/android/app/build/outputs/apk/release/app-release.apk
```
Install it on a phone with `adb install -r app-release.apk`, or copy the file across and open it.

**`EXPO_PUBLIC_API_URL` must be set on the build command.** It is baked into the APK at build time.
Without it the app falls back to the Expo dev-server host, which a standalone APK does not have, and
every request fails. Use the laptop's LAN IP and keep the phone on the same Wi-Fi, or a hosted API
address once there is one.

**Why `expo-build-properties` is in the plugin list.** A release Android build blocks plain HTTP.
Our API is served over HTTP, so without `android.usesCleartextTraffic: true` the built app cannot
reach it at all. Debug builds already allow cleartext; this carries it into a release build.

The APK is signed with the debug keystore, which is what the Expo template configures. That is fine
for a demo and for the usability sessions; it is not a Play Store upload key.

### Android APK (cloud build, needs an Expo account)
```bash
cd mobile
npm install -g eas-cli && eas login
eas build:configure                        # first time only
eas build -p android --profile preview     # outputs an .apk download link
```
Download the APK → test on a real phone → attach to GitHub Release `v1.0.0` → link it in the README.
### Hosting the API and the dashboard on Vercel

Two projects from the one repository. Everything they need is already committed —
`server/vercel.json`, `server/api/index.js` and `admin/vercel.json` — so this is configuration only.

**Before the first deploy.** In Atlas, set **Network Access → Allow access from anywhere
(`0.0.0.0/0`)**. Vercel functions have no fixed IP, so an allowlist of one laptop rejects them, and
the symptom is requests that simply hang until they time out.

**1. The API.** New Project → import the repo → **Root Directory: `server`**. Environment variables:

| Name | Value |
|---|---|
| `MONGODB_URI` | the Atlas connection string |
| `JWT_SECRET` | a long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `development` — see below |
| `RESEND_API_KEY` | the Resend key |
| `CLIENT_ORIGINS` | the admin URL, once it exists (step 3) |

Deploy, then open `https://<api>.vercel.app/api/health`. If that does not answer, nothing else can
work: check Atlas network access, the connection string, and that `JWT_SECRET` is set — the API
refuses to start without it.

**2. The dashboard, on Netlify.** The API is an Express server, so it belongs on Vercel; the
dashboard is a static Vite build, which Netlify serves happily. `netlify.toml` at the repository
root already carries the build settings, so nothing needs typing into the Netlify UI:

- netlify.com → **Add new site → Import an existing project** → pick the repository.
- Leave the build settings alone. Netlify reads `netlify.toml`, which sets the base directory to
  `admin`, the command to `npm run build` and the publish directory to `admin/dist`.
- **Site configuration → Environment variables → Add:**
  `VITE_API_URL = https://<api>.vercel.app/api`
- **Deploy.**

> **Add the variable before the first build, or add it and then redeploy.** Vite bakes
> `VITE_API_URL` into the JavaScript at build time; it is not read when the page loads. A site built
> without it ships with `baseURL: undefined` and every request fails, no matter what the variable
> says afterwards. "Clear cache and deploy site" is what applies the change.

`netlify.toml` also redirects every path to `index.html`. Without that, opening or refreshing a deep
link such as `/fleet` asks Netlify for a file that does not exist and gets a 404 — the dashboard
only works from the home page.

**3. Join them up.** Set `CLIENT_ORIGINS` on the **API** project to the Netlify URL exactly, with no
trailing slash, for example `https://ceylon-smart-bus.netlify.app`, then **redeploy the API** —
environment changes do not reach a deployment that already exists. Without this the dashboard loads
and every request fails CORS, which in the browser console reads as a network error rather than
anything about origins. The mobile app is unaffected: apps send no `Origin` header, and
`checkRequestOrigin` allows those.

> **Why `NODE_ENV=development` on a hosted API.** In production the OTP is withheld from the API
> response, and registration sends no email — so on a hosted API with `NODE_ENV=production`
> **nobody can finish signing up**. Password reset does email, but Resend's shared sender only
> delivers to the Resend account's own owner until a domain is verified. Running the hosted demo as
> `development` keeps the codes in the response, exactly as they are locally, which is what the
> screens already expect.
>
> It is a demo decision, not a production one, and the report should say so: codes travel in API
> responses, so this deployment must not hold real users' data. The honest fix for a real
> deployment is to verify a domain in Resend and email the registration code as well as the reset
> code.

Then rebuild the APK with `EXPO_PUBLIC_API_URL` pointing at the hosted API, and it works on any
network with no laptop running.

## 11. README must contain (examiner checklist)
Project overview · architecture diagram · tech stack · folder structure · prerequisites · setup for server/admin/mobile · env variables (names only) ·
seed accounts · how to run tests · APK link · hosted admin URL + demo admin login · team members & responsibilities.

## 12. Viva preparation (each member)
Be able to: open your screens and show **every CRUD operation live**; explain your folder's code path (screen → service → API → controller → service → model);
justify at least two stack choices; explain one deviation from Figma; show one usability issue you found and how you fixed it.
