# Prompt 2 — Frontend (mobile): Role from server, onboarding save, rating UI

> Run this **after** the backend prompt is done and its tests pass.
> Paste everything below into your coding agent, opened in the `chess-one-mobile` folder.

---

## Context

You are working on `chess-one-mobile` — Expo + React Native + Expo Router (routes in `src/app/`), TypeScript, axios (`src/services/apiClient.ts` attaches the JWT automatically).
Read `AGENTS.md` first and follow it. Use `npx expo install` for any new package (none should be needed).
Theme: `src/constants/chessone-theme.ts` (`COLORS`, `SIZES`, `FONTS`, `SHADOWS`). Use these and don't hardcode new colours, except the two rating colours below.

The backend now provides:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/users/me` | My profile: `id, name, email, avatarUrl, role, rating, gamesPlayed, school, schoolClass, level, fideId, parentName, parentEmail, onboardingDone` |
| PATCH | `/api/users/me` | Save the profile (onboarding). `role` may only be `STUDENT` or `PARENT`. Returns the updated user. 403 `ROLE_NOT_ALLOWED` otherwise. |
| POST | `/api/auth/google`, `/api/auth/dev-login` | `user` now includes `role`, `rating`, `onboardingDone` |
| GET | `/api/games/:id/result` | Adds `rating: { applied, whiteRatingChange, blackRatingChange }`; players include `rating` |
| Socket | `game:finished` | Payload adds `whiteRatingChange, blackRatingChange, whiteRating, blackRating` |

Backend roles are UPPERCASE (`STUDENT`). The app's `UserRole` type is Title case (`'Student'`). Convert between them in one place.

## Goal

1. Onboarding lets the user pick **Student** or **Parent** and saves the whole profile to the server.
2. After login, the app decides **onboarding vs home** from `user.onboardingDone` (server), not AsyncStorage.
3. The role comes from the **server**. The header role-switch works **only in development**.
4. The **real rating** appears on Student Home, the player cards and the history/career screen, and the **+/− change** appears after each PvP game.

Don't change the board, move logic, clocks, sockets connection logic, or any other screen.

---

## File structure (create / modify)

```
chess-one-mobile/src/
├── types/
│   ├── auth.types.ts                  MODIFY  (BackendRole, UserProfile; extend GoogleUser)
│   └── game.types.ts                  MODIFY  (rating on GamePlayer, rating fields on results)
├── services/
│   └── user.service.ts                NEW     (getMyProfile, updateMyProfile)
├── utils/
│   └── role.utils.ts                  NEW     (toAppRole, toBackendRole)
├── store/
│   └── authStore.ts                   MODIFY  (updateUser(partial) to merge profile into user)
├── features/
│   ├── roles/roleStore.ts             MODIFY  (syncFromServer)
│   └── home/StudentHome.tsx           MODIFY  (real rating card)
├── hooks/
│   └── useProfile.ts                  NEW     (load + refresh profile, sync role)
├── components/
│   ├── navigation/AppHeader.tsx       MODIFY  (role switch only in __DEV__)
│   ├── game/PlayerInfo.tsx            MODIFY  (show "(1200)" next to name)
│   ├── game/GameOverModal.tsx         MODIFY  (rating box with +/−)
│   └── game/RatingChange.tsx          NEW     (small "+20" / "−20" badge)
├── socket/game.socket.ts              MODIFY  (type the new game:finished fields)
└── app/
    ├── onboarding.tsx                 MODIFY  (role picker + save to server)
    ├── login.tsx                      MODIFY  (route by onboardingDone; use real rating)
    ├── game/[gameId].tsx              MODIFY  (pass rating info to PlayerInfo + GameOverModal)
    └── game/result/[gameId].tsx       MODIFY  (show rating change)
```

---

## Step 1 — Types

`src/types/auth.types.ts`:
```ts
export type BackendRole = 'STUDENT' | 'PARENT' | 'COACH' | 'SCHOOL' | 'ORGANISER' | 'ADMIN';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: BackendRole;
  rating: number;
  gamesPlayed: number;
  school?: string | null;
  schoolClass?: string | null;
  level?: 'Beginner' | 'Developing' | 'Advanced' | null;
  fideId?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  onboardingDone: boolean;
}

export type UpdateProfileRequest = Partial<Pick<UserProfile,
  'name' | 'school' | 'schoolClass' | 'level' | 'fideId' | 'parentName' | 'parentEmail'>> & {
  role?: 'STUDENT' | 'PARENT';
};
```
Extend `GoogleUser` with optional `role?: BackendRole; rating?: number; gamesPlayed?: number; onboardingDone?: boolean;`.

`src/types/game.types.ts`:
- `GamePlayer` → add `rating?: number`.
- `GameResultResponse` → add `rating?: { applied: boolean; whiteRatingChange: number | null; blackRatingChange: number | null }`.
- `Game` and `GameState` → add optional `whiteRatingChange?: number | null; blackRatingChange?: number | null;`.
- Add `GameFinishedPayload` with `gameId, gameCode, result, winnerId, whiteRatingChange?, blackRatingChange?, whiteRating?, blackRating?`.

## Step 2 — `src/utils/role.utils.ts` (NEW)

```ts
toAppRole(r: BackendRole): UserRole
// STUDENT→'Student', PARENT→'Parent', COACH→'Coach', SCHOOL→'School',
// ORGANISER→'Organiser', ADMIN→'Organiser' (temporary, until an Admin home exists)

toBackendRole(r: UserRole): BackendRole   // the reverse
```

## Step 3 — `src/services/user.service.ts` (NEW)

Use `apiClient`:
```ts
getMyProfile(): Promise<UserProfile>                 // GET /api/users/me → res.data.user
updateMyProfile(body: UpdateProfileRequest): Promise<UserProfile>   // PATCH /api/users/me → res.data.user
```
On error, throw an `Error` with the server's `error.message` when it exists.

## Step 4 — Stores

- `authStore.ts` → add `updateUser(partial: Partial<GoogleUser>)`. It merges into `state.user`, saves to storage the same way the existing code does, and notifies listeners.
- `roleStore.ts` → add `syncFromServer(role: BackendRole)`. It calls `setRole(toAppRole(role))`. AsyncStorage is now just a cache. The server value always wins.

## Step 5 — `src/hooks/useProfile.ts` (NEW)

`useProfile()` returns `{ profile, loading, error, refresh }`.
- When it mounts while authenticated, it calls `getMyProfile()`, then `authStore.updateUser({ role, rating, gamesPlayed, onboardingDone })` and `roleStore.syncFromServer(profile.role)`.
- `refresh()` does the same. Call it after a game ends, so the home rating is up to date.
- Call `useProfile()` once at app level, either in `src/app/_layout.tsx` or `HomeScreen.tsx`. Then the role is synced every time the app opens.

## Step 6 — Onboarding (`src/app/onboarding.tsx`)

- Add `role: 'STUDENT' | 'PARENT'` to `formData` (default `'STUDENT'`).
- At the **top of step 1**, add an "I am a" label and two cards side by side: **Student** and **Parent**. Style them like the existing `levelCard` / `levelCardActive`.
- Replace `completeOnboarding` with this:
  1. Show a loading state on the button (and disable double taps).
  2. `const user = await updateMyProfile({ ...formData without consent })`. Send empty strings as `""`; the server turns them into null.
  3. `authStore.updateUser(user)` and `roleStore.syncFromServer(user.role)`.
  4. Also keep `AsyncStorage.setItem('@chessone_onboardingDone','true')` as a fallback.
  5. `router.replace('/')`.
  6. On error, show the message under the button and stay on the screen.
- **Skip** → call `updateMyProfile({ role: 'STUDENT' })` so `onboardingDone` becomes true, then go home.
- Step 3 → when `parentEmail` isn't empty, check it's a valid email before continuing.

## Step 7 — Login routing (`src/app/login.tsx`)

In `handleGoogleSignIn` (around line 145), replace the AsyncStorage check:
```ts
const profile = await getMyProfile();         // fresh from server
authStore.updateUser(profile); roleStore.syncFromServer(profile.role);
router.replace(profile.onboardingDone ? '/' : '/onboarding');
```
Do the same in the dev-login path, if one exists. If `getMyProfile` fails, fall back to the old AsyncStorage check.
In the career stats block, replace the locally computed `calculatedRating` with `user.rating` from the store (keep the old calculation only if `user.rating` is undefined).

## Step 8 — Header role switch (`src/components/navigation/AppHeader.tsx`)

- The role-cycle tap (around line 53) works only when `__DEV__` is true.
- When `__DEV__` is false, show the role as a plain label pill (e.g. "Student") that does nothing when tapped.

## Step 9 — Student Home (`src/features/home/StudentHome.tsx`)

- Replace `SAMPLE_STUDENT_STATS.learningRating` with a **rating card** from the auth store:
  - Eyebrow: `YOUR RATING`
  - Big number: `user.rating ?? 1200` (colour `COLORS.primary`, 26–28px, weight 800)
  - Next to it: the last change, if one is known (from the last finished game), using `RatingChange`
  - Sub text: `ChessOne rating · {gamesPlayed} games played`
  - Card background `COLORS.hero`, radius `SIZES.radiusCard`
- Keep the Lessons and Practice stat cards as they are (still sample data for now).

## Step 10 — `src/components/game/RatingChange.tsx` (NEW)

Props: `{ change: number | null | undefined; size?: 'sm' | 'md' }`.
- If `change` is null or undefined → render nothing.
- `> 0` → `+20` in green `#3B6D11`. `< 0` → `−20` in red `#A32D2D` (use a real minus sign "−"). `0` → `±0` in `COLORS.textBody`.
- Bold, with no background.

## Step 11 — Player cards (`src/components/game/PlayerInfo.tsx`)

- Next to the name, show `({player.rating})` in `COLORS.textBody` with normal weight, only when `player?.rating` exists and `isAI` is false.

## Step 12 — Game screen + Game Over modal

`src/app/game/[gameId].tsx`:
- Pass the players (with `rating`) to `PlayerInfo`, as it does today. Rating comes from the game data.
- Save `whiteRatingChange` / `blackRatingChange` from the `game:finished` socket payload (or from `getGameState`/result as a fallback) into local state.
- Pass them to `GameOverModal` as new props: `whiteRatingChange`, `blackRatingChange`.
- When the game finishes, call `useProfile().refresh()` so Home shows the new rating.

`src/components/game/GameOverModal.tsx`:
- New optional props: `whiteRatingChange?: number | null; blackRatingChange?: number | null;`.
- When `!isAI` and at least one change isn't null, show a **Rating** box above the buttons:
  - Background `COLORS.background`, radius 10, padding 10
  - Eyebrow `RATING`
  - Row 1: `{white name}{" (you)" if user is white}` … `{new rating}` + `<RatingChange change={whiteRatingChange} />`
  - Row 2: the same for black
  - New rating = `player.rating` (the rating before the game) + change. Or use `whiteRating`/`blackRating` from the socket payload if they're there.
- AI games: no rating box.

`src/app/game/result/[gameId].tsx`:
- Read `result.rating` from `GET /api/games/:id/result` and show the same two rows, using `RatingChange`.

`src/socket/game.socket.ts`:
- Type the `game:finished` handler payload as `GameFinishedPayload`.

---

## Rules
- TypeScript strict, with no `any` in new code.
- Keep the existing styling approach (`StyleSheet.create` + theme constants).
- Handle loading and error states. The app must not crash if `/users/me` fails. Fall back to the cached user.
- Don't remove sample data used by other screens. Only replace the learning-rating number on Student Home and the rating on the career screen.

## Manual test checklist
1. Brand-new Google user → onboarding opens → choose **Parent** → finish → the Parent home opens. Check in the DB that `role = PARENT` and `onboardingDone = true`.
2. Log out and in again (or use another browser) → no onboarding, still Parent.
3. Production build (`__DEV__` false) → the header role pill can't be tapped to switch.
4. Two students play, and one checkmates → the modal shows `+20` green / `−20` red with the new ratings → Home shows the new rating.
5. Open the result page later → the same +/− is shown, and the rating hasn't changed again.
6. Play vs AI → no rating box, and the rating is unchanged.
7. `npx tsc --noEmit` and `npx expo lint` both pass.
