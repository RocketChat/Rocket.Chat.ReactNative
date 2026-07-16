# 023 — `useCurrentUser()` / `useCurrentUserId()` redux seam

- **Status:** TODO
- **Priority:** P2
- **Effort:** S
- **Risk:** Low (extract + swap; no state-shape change)
- **Planned at:** current HEAD of `native-34-roomview-hooks`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. Prettier: tabs, single quotes, 130 width, no trailing commas. React Compiler (`'use memo'`) active in RoomView.

`getUserSelector` (`app/selectors/login.ts:20`) is a reselect **identity** selector over `state.login.user`:

```ts
const getUser = (state: IApplicationState): IUser => state.login?.user as IUser;
export const getUserSelector = createSelector([getUser], user => user);
```

The architecture review (`plans/architecture-review-findings.md`, arch-redux P1, confirmed at HEAD) flagged it fanned across **5 subscription sites**, each re-deriving how it reaches the logged-in user (whole object vs `.id` narrow). Two of those sites (`useReadOnly`, RightButtons) only need a slice, but subscribe to more. Add a small hook seam and migrate the 5 sites.

## Change

### 1. Add the hooks

Colocate with the selector — create/extend a hooks module next to `getUserSelector` consumption. Preferred home: **`app/lib/hooks/useAppSelector.ts`'s neighborhood** — add a new file `app/lib/hooks/useCurrentUser.ts` (matches repo's one-hook-per-file convention: `useUserData.ts`, `useUserStatusColor.ts` already live there). Import `useAppSelector` + `getUserSelector`.

```ts
import { type IUser } from '../../definitions';
import { getUserSelector } from '../../selectors/login';
import { useAppSelector } from './useAppSelector';

export const useCurrentUser = (): IUser => useAppSelector(getUserSelector);

export const useCurrentUserId = (): string => useAppSelector(state => getUserSelector(state).id);
```

Rationale for two hooks: `useCurrentUserId` subscribes to the **primitive** `id` (re-renders only when the id changes — login/server switch), while `useCurrentUser` subscribes to the whole user object (identity-stable per reselect, re-renders on any user change). Sites that need only the id use the narrow one.

### 2. Migrate the 5 sites

| #   | Site                                                   | Current                                                                                                        | After                                                                          | Notes                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/views/RoomView/index.tsx:331` (`mapStateToProps`) | `user: getUserSelector(state)`                                                                                 | _see §3_ — leave in `mapStateToProps` for now, or fold into the hook migration | The prop `user` feeds `userRef` (`:117`), `showMessageInMainThread` (`:303`), `user={user}` (`:312,:322`). Whole-user needed → `useCurrentUser()`.                                                                                                                                                                                              |
| 2   | `useReadOnly.ts:26`                                    | `const user = useAppSelector(getUserSelector)` then uses `user.username`, `user.roles` (`:33`)                 | `const user = useCurrentUser()`                                                | Finding also asks to **narrow to username+roles** (arch-redux P2). Cleanest: keep `useCurrentUser()` (identity-stable, no extra render churn since reselect memoizes) — narrowing to a `{username, roles}` object would allocate a new ref each render and re-render _more_. Use `useCurrentUser()` and document why full-user is correct here. |
| 3   | `useRoomMessageHandlers.tsx:47`                        | `const user = useAppSelector(getUserSelector)` — used at `:226` `sendMessage(rid, message, tmid, user, tshow)` | `const user = useCurrentUser()`                                                | Whole user passed to `sendMessage`.                                                                                                                                                                                                                                                                                                             |
| 4   | `RightButtons.tsx:105`                                 | `const userId = useAppSelector(state => getUserSelector(state).id)`                                            | `const userId = useCurrentUserId()`                                            | Only `id` used.                                                                                                                                                                                                                                                                                                                                 |
| 5   | `LeftButtons.tsx:32`                                   | `const { id: userId, token } = useAppSelector(getUserSelector)`                                                | `const { id: userId, token } = useCurrentUser()`                               | Needs `id` **and** `token` → whole-user hook.                                                                                                                                                                                                                                                                                                   |

Remove now-unused `getUserSelector` imports from migrated files (`useReadOnly.ts:7`, `useRoomMessageHandlers.tsx` import, `RightButtons.tsx`, `LeftButtons.tsx:8`). Keep it in `index.tsx` only if §3 leaves `mapStateToProps` untouched.

### 3. Optional follow-up — drop `connect()` from RoomView index

Separate, lower-priority. `index.tsx:330-341` still uses `connect(mapStateToProps)` for 8 props (`user`, `isAuthenticated`, `Message_GroupingPeriod`, `baseUrl`, `serverVersion`, `Message_Read_Receipt_Enabled`, `Hide_System_Messages`, `livechatAllowManualOnHold`) while the whole subtree is hooks.

**Note (arch-verify PARTIAL 6):** the original finding claimed `connect` "blocks 'use memo'" — that is **wrong**. `RoomView` already has `'use memo'` at `index.tsx:57`. So this is a _consistency_ cleanup, not a compiler unblock. Do **not** justify it as a perf fix.

If done: replace each `mapStateToProps` field with a hook inside the component (`useCurrentUser()`, `useAppSelector(state => state.login.isAuthenticated)`, `useAppSelector(state => state.settings.X)`, etc.), drop `connect(...)` and the `mapStateToProps` block, and unwrap the HOC chain accordingly (`withDimensions`/`withSafeAreaInsets`/`withActionSheet`/`withMasterDetail` — these have their own hook equivalents used elsewhere: `useMasterDetail`, `useActionSheet`, dimensions/insets hooks; migrate only if straightforward, else leave the HOCs). **Recommend deferring §3 to its own plan** unless the executor confirms it's mechanical — keep §1+§2 shippable independently.

## Re-render impact notes

- `getUserSelector` is a reselect identity selector: same object reference until `state.login.user` changes. So `useCurrentUser()` re-renders a consumer only on a genuine user change (login, profile update, server switch) — same behavior as today's `useAppSelector(getUserSelector)`. **No new churn.**
- `useCurrentUserId()` subscribes to the `id` primitive: strictly fewer re-renders than the whole-user subscription for RightButtons (which only needs `id`) — a small improvement, matching what `RightButtons.tsx:105` already does inline.
- Do **not** replace `useReadOnly`'s whole-user sub with a fabricated `{username, roles}` object selector: that allocates a fresh object each render, defeating referential stability and re-rendering _more_. The narrowing the finding asks for is best served by the identity selector (username/roles read off the stable object) — call this out in the migration.

## Scope

- **In scope (§1+§2):** new `app/lib/hooks/useCurrentUser.ts`; the 5 migration sites + their import cleanup. `getUserSelector` stays exported (other app areas use it).
- **In scope (§3, optional):** `index.tsx` `connect`→hooks — only if mechanical; otherwise defer.
- **Out of scope:** other `getUserSelector` consumers outside RoomView; `login.ts` selector itself; state shape.

## Verification / done criteria

1. `pnpm lint` → exits 0.
2. `TZ=UTC pnpm test` → all suites pass (existing `useReadOnly`/`RightButtons`/`useRoomMessageHandlers` suites cover behavior).
3. `grep -rn "getUserSelector" app/views/RoomView` → only `index.tsx` (if §3 deferred), zero elsewhere.
4. New hooks used at all 5 sites: `grep -rn "useCurrentUser\|useCurrentUserId" app/views/RoomView app/lib/hooks`.

## Test plan

Behavior-preserving. Existing suites for the 4 migrated hooks/components must stay green. Optionally add a tiny `useCurrentUser.test.ts` asserting it returns the redux user and `useCurrentUserId` the id — only if the hooks module gains logic beyond the passthrough (it doesn't, so a test is optional and low-value; skip unless the executor wants a regression anchor).

## Escape hatches

- If migrating `useReadOnly` to `useCurrentUser()` changes its test's mock expectations (it may mock `useAppSelector(getUserSelector)` directly), update the mock to the new hook — do not revert the migration.
- If §3 (drop `connect`) unwinds more than the `mapStateToProps` block (e.g. HOC chain has no clean hook equivalent), STOP §3 and ship §1+§2; report what blocked it.
