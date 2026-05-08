# Smashr — Technical Architecture & Stack Reference

> Last updated: May 2026  
> Update this file whenever a new API, service, or major feature is added.

---

## Table of Contents

1. [Framework](#1-framework-react-native--expo)
2. [Navigation](#2-navigation-expo-router)
3. [Firebase](#3-firebase-auth--firestore)
4. [Expo Location](#4-expo-location)
5. [Overpass API — Court Finder](#5-overpass-api-openstreetmap--court-finder)
6. [DUPR Integration](#6-dupr-integration-pathway-built-pending-credentials)
7. [Libraries Summary](#7-key-libraries-summary)
8. [Full Data Flow — VsV Match](#8-data-flow--full-vsv-match)
9. [File Structure](#9-file-structure)
10. [Environment & Credentials](#10-environment--credentials)

---

## 1. Framework: React Native + Expo

**React Native** — write one JavaScript codebase that compiles to a real native iOS and Android app (not a web view).

**Expo SDK ~54** — toolchain on top of React Native. Handles builds, camera, location, icons, and more without needing Xcode or Android Studio for day-to-day development.

**Run the app locally:**
```bash
npx expo start
```
Scan the QR code in the **Expo Go** app on your phone. Changes reflect instantly via hot reload.

**Build for production:**
```bash
npx eas build --platform android   # or ios
```

---

## 2. Navigation: Expo Router

File-based routing — the folder/file structure inside `app/` automatically becomes your screen routes, the same way a website works.

### Route Map

| File | Route | Screen |
|---|---|---|
| `app/index.jsx` | `/` | Auth gate — redirects to tabs or login |
| `app/(auth)/login.jsx` | `/login` | Login |
| `app/(auth)/createAccount.jsx` | `/createAccount` | Sign up |
| `app/(auth)/forgetpassword.jsx` | `/forgetpassword` | Password reset |
| `app/(tabs)/home/homepage.jsx` | Tab 1 | VsV home |
| `app/(tabs)/tournament/index.jsx` | Tab 2 | Tournaments |
| `app/(tabs)/programs/index.jsx` | Tab 3 | Programs |
| `app/(tabs)/booking/index.jsx` | Tab 4 | My Bookings |
| `app/(tabs)/account/index.jsx` | Tab 5 | Account / Settings |
| `app/(tabs)/friends/index.jsx` | Hidden tab | Friends (via header icon) |
| `app/findmatch.jsx` | `/findmatch?type=singles` | Find a match flow |
| `app/scoresummary.jsx` | `/scoresummary` | Post-match score entry |
| `app/(onboarding)/duprconnect.js` | `/duprconnect` | Link DUPR account |
| `app/(onboarding)/gpnconnect.js` | `/gpnconnect` | Create GPN account |

### Tab Bar

Configured in `app/(tabs)/_layout.js`.  
5 visible tabs: **VsV · Tournaments · Programs · Bookings · Account**  
Friends tab is hidden from the bar (`href: null`) but accessible — every page's top-left header icon links to it.

### Navigation Helpers

```js
import { useRouter, useLocalSearchParams } from "expo-router";

const router = useRouter();

router.push("/findmatch?type=singles");       // go forward
router.push({ pathname: "/scoresummary", params: { gameType: "singles" } });
router.replace("/");                          // replace stack (used after logout)
router.back();                                // go back
```

---

## 3. Firebase (Auth + Firestore)

**Project config:** `services/firebaseConfig.js`  
Exports: `auth` (Firebase Auth instance) and `db` (Firestore instance).

### Firebase Authentication

Handles sign-up, login, and logout. Firebase manages passwords and sessions — no custom server needed.

| Action | Code |
|---|---|
| Sign up | `createUserWithEmailAndPassword(auth, email, password)` |
| Log in | `signInWithEmailAndPassword(auth, email, password)` |
| Log out | `signOut(auth)` |
| Current user | `auth.currentUser` |
| Listen for auth state | `onAuthStateChanged(auth, callback)` |

`app/index.jsx` uses `onAuthStateChanged` as the app gate — if a session exists the user goes straight to the tabs, otherwise to the login screen.

### Firestore (Database)

NoSQL cloud database. Data lives as documents inside collections.

#### Collections

**`vsv_lobby`** — active match searchers  
Written when a user starts searching for a match. Cleaned up when they leave the screen.

```jsonc
// vsv_lobby/{userId}
{
  "uid": "abc123",
  "displayName": "SafwanS",
  "lat": 43.651070,
  "lng": -79.347015,
  "gameType": "singles",      // "singles" | "doubles" | "friendly"
  "status": "searching",
  "updatedAt": Timestamp
}
```

**`pending_dupr_matches`** — every completed match result  
Written immediately after a score is submitted. Stays here until DUPR credentials are activated, then gets synced.

```jsonc
// pending_dupr_matches/{autoId}
{
  "gameType": "singles",
  "courtName": "Smith Park Pickleball Court",
  "playedAt": "2026-05-06T14:30:00Z",
  "team1": [{ "uid": "abc123", "displayName": "SafwanS", "duprId": null }],
  "team2": [{ "uid": "xyz789", "displayName": "Opponent", "duprId": null }],
  "scores": [
    { "team1": 11, "team2": 7 },
    { "team1": 9,  "team2": 11 },
    { "team1": 11, "team2": 6 }
  ],
  "winner": "team1",
  "duprSubmitted": false,
  "duprSubmittedAt": null,
  "createdAt": Timestamp
}
```

Once `duprSubmitted` flips to `true`, the record also stores `duprMatchId` from DUPR's response.

---

## 4. Expo Location

**Package:** `expo-location`  
**Used in:** `app/findmatch.jsx`

Gets the user's real-time GPS coordinates to power the player-finding and court-finding features.

```js
import * as Location from "expo-location";

// Request permission
const { status } = await Location.requestForegroundPermissionsAsync();

// Get coordinates
const loc = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
});
const { latitude, longitude } = loc.coords;
```

Permission is requested once at the moment the user taps "Find Players Near Me". If denied, the search stops and shows an alert.

---

## 5. Overpass API (OpenStreetMap) — Court Finder

**What it is:** Free, open-source global map database. No API key required. Used to find real pickleball and tennis courts near any GPS coordinate.

**Endpoint:** `https://overpass-api.de/api/interpreter` (POST)  
**Cost:** Free, no account needed  
**Used in:** `app/findmatch.jsx` → `fetchNearbyCourts()`

### Query Example

```
[out:json][timeout:15];
node["sport"="pickleball"](around:15000, 43.651, -79.347);
out 10;
```

This asks: *"Give me up to 10 pickleball court nodes within 15 km of this coordinate."*

### Fallback Chain

1. Pickleball courts (nodes) within 15 km
2. Pickleball courts (ways/areas) within 15 km
3. Tennis courts (nodes) within 15 km
4. Tennis courts (ways/areas) within 15 km
5. Retry all with 30 km radius if none found

### Court Ranking Formula

Once courts are found, they're ranked by **total combined travel distance**:

```
score = haversine(myLat, myLng, court.lat, court.lng)
      + haversine(theirLat, theirLng, court.lat, court.lng)
```

The court with the lowest combined distance is shown first — the fairest spot for both players.

---

## 6. DUPR Integration (Pathway Built, Pending Credentials)

**What DUPR is:** Dynamic Universal Pickleball Rating — the official global rating system for pickleball.

**File:** `services/duprService.js`

### Current State

Every match result is saved to Firestore immediately. DUPR submission is fully built but gated:

```js
// services/duprService.js — activate when ready:
const DUPR_ENABLED = false;    // ← change to true
const DUPR_API_KEY = "";       // ← paste key from DUPR
const DUPR_CLUB_ID = "";       // ← paste Smashr's club ID from DUPR dashboard
```

### Steps to Activate

1. Go to **mydupr.com** — register Smashr as an official club
2. Email **api@mydupr.com** — request API access for club "Smashr"
3. Receive API key + club ID
4. Paste into the three lines above, set `DUPR_ENABLED = true`
5. Call `flushPendingMatches()` once — every past match in Firestore gets submitted retroactively

### Submission Payload (sent to DUPR)

```jsonc
POST https://api.mydupr.com/api/v1.0/match
Authorization: Bearer {DUPR_API_KEY}

{
  "clubId": "SMASHR_CLUB_ID",
  "matches": [{
    "eventDate": "2026-05-06T14:30:00Z",
    "format": "SINGLES",
    "teams": [
      {
        "players": [{ "duprId": null, "displayName": "SafwanS" }],
        "scores": [11, 9, 11]
      },
      {
        "players": [{ "duprId": null, "displayName": "Opponent" }],
        "scores": [7, 11, 6]
      }
    ]
  }]
}
```

> **Note:** The payload shape above may need adjusting once you receive DUPR's official API schema. The `_buildPayload()` function in `duprService.js` is the only place to update.

---

## 7. Key Libraries Summary

| Library | Version | Used For |
|---|---|---|
| `expo` | ~54 | Core framework and build tooling |
| `expo-router` | ~4 | File-based navigation |
| `expo-linear-gradient` | latest | Blue gradient headers on every page |
| `expo-location` | latest | GPS coordinates for match finding |
| `react-native-safe-area-context` | latest | Respecting notches and status bars |
| `@expo/vector-icons` (Ionicons) | latest | All icons throughout the app |
| `firebase` (Auth) | ^11 | User authentication |
| `firebase` (Firestore) | ^11 | Cloud database for matches and lobby |
| `Overpass API` | — | Finding courts on OpenStreetMap (free) |
| `DUPR API` *(pending)* | — | Submitting match results to DUPR ratings |

---

## 8. Data Flow — Full VsV Match

```
1. User opens VsV tab
      ↓
2. Taps "Singles" / "Doubles" / "Friendly Battle"
      ↓
3. app/findmatch.jsx opens
      ↓
4. expo-location → requests GPS permission → gets coordinates
      ↓
5. Coordinates + game type saved to Firestore vsv_lobby/{userId}
      ↓
6. Firestore query → find other users in vsv_lobby
   where gameType == selected AND status == "searching"
      ↓
7. Filter results to within 25 km using Haversine formula
      ↓
8. Player list shown — user taps "Challenge"
      ↓
9. Midpoint calculated between both players' coordinates
      ↓
10. Overpass API POST → find pickleball courts within 15 km of midpoint
      ↓
11. Courts ranked by total travel distance (fairest = top)
      ↓
12. User taps "Let's Play!" → navigates to app/scoresummary.jsx
      ↓
13. User enters game scores (up to 3 games)
      ↓
14. Match data saved to Firestore pending_dupr_matches
      ↓
15. (When DUPR active) → POST to DUPR API → ratings update globally
```

---

## 9. File Structure

```
smashr/
├── app/
│   ├── _layout.js                  Root stack navigator
│   ├── index.jsx                   Auth gate
│   ├── findmatch.jsx               Match finding flow
│   ├── scoresummary.jsx            Post-match score entry
│   ├── friends.jsx                 Standalone friends route
│   ├── (auth)/
│   │   ├── login.jsx
│   │   ├── createAccount.jsx
│   │   └── forgetpassword.jsx
│   ├── (onboarding)/
│   │   └── duprconnect.js          Link DUPR account
│   └── (tabs)/
│       ├── _layout.js              Tab bar config (5 tabs)
│       ├── home/homepage.jsx       VsV screen
│       ├── tournament/index.jsx    Tournaments screen
│       ├── programs/index.jsx      Programs screen
│       ├── booking/index.jsx       My Bookings screen
│       ├── account/index.jsx       Account / Settings
│       └── friends/index.jsx       Friends (hidden tab)
│
├── constants/
│   └── colors.js                   Global color palette
│
├── services/
│   ├── firebaseConfig.js           Firebase init, exports auth + db
│   ├── duprService.js              DUPR submission logic
│   └── bookingService.js           GPN booking helpers
│
├── hooks/
│   └── useBooking.js               Hook: fetch user's registered tournaments
│
├── assets/
│   └── img/Logo.jpg                App icon and splash image
│
├── app.config.js                   Expo app config (name, icon, splash)
├── package.json
└── ARCHITECTURE.md                 ← this file
```

---

## 10. Environment & Credentials

| Credential | Where it lives | Status |
|---|---|---|
| Firebase API Key | `services/firebaseConfig.js` (hardcoded) | ✅ Active |
| DUPR API Key | `services/duprService.js` (placeholder) | ⏳ Pending |
| DUPR Club ID | `services/duprService.js` (placeholder) | ⏳ Pending |

> **Security note:** Before going to production, move the Firebase key to environment variables using `expo-constants` and a `.env` file. Never commit real secrets to a public GitHub repo.

---

*This document covers the architecture as of the initial build. Update each section as new features are added.*
