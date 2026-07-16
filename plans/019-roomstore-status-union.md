# 019 — Replace `loading`/`subscribed`/`joined` booleans with a discriminated `status` union

- **Status:** TODO
- **Priority:** P1
- **Effort:** M
- **Risk:** Medium (touches store lifecycle + every hydration consumer; guarded by RoomStore + footer + omnichannel suites)
- **Planned at:** `HEAD` of `native-34-roomview-hooks` (read current file state before editing — line numbers may drift)

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, `baseUrl` = `app/`. pnpm, Zustand, React 19 + React Compiler (`'use memo'`). Prettier: tabs, single quotes, 130 width, no trailing commas. Tests: Jest + `@testing-library/react-native`, `TZ=UTC pnpm test`; DB tests mock `database.active` (repo pattern — never LokiJS). Lint: `pnpm lint`. Never add `Co-Authored-By` trailers.

`RoomState` (`app/views/RoomView/definitions.ts:164-185`) models room hydration as **three independent booleans**:

```ts
joined: boolean;
subscribed: boolean;   // definitions.ts:168
...
loading: boolean;
```

Set in `app/views/RoomView/stores/RoomStore.ts` at:

- **`:55-59`** initial state — `joined: true`, `subscribed: 'id' in initialRoom`, `loading: true`.
- **`:71,75,99,102`** `init()` — `set({ loading: true })`, then `loading: false` on invite/success/catch.
- **`:135-137`** `observeRoom` emit with a row — `subscribed: true, joined: true`.
- **`:140`** `observeRoom` emit with no row — `subscribed: false` (+ `joined: false` unless `t === 'd'`).

Finding (arch-storelayer P1, `plans/architecture-review-findings.md:95,223`): three booleans make **illegal states representable** (`loading && !subscribed && joined`, etc.). Replace with a discriminated `status` union that encodes only the reachable states. A related open watch (findings:201): `joined` moved from latched-once to continuously derived per `observeRoom` emit — preserve that behavior for omnichannel take/preview transitions.

### Key discovery — `subscribed` is dead read state

`subscribed` is **written** (`:56,135,140`) but **never read** anywhere. Verified:

```
grep -rn "s.subscribed\|state.subscribed\|\.subscribed\b" app --include=*.ts --include=*.tsx
```

returns only redux `state.room.subscribedRoom` (unrelated feature) and the RoomStore writes. So `subscribed` carries no consumer today; the union can absorb it as a state distinction without any consumer migration. Do NOT keep it as a standalone field.

Also: `stateAttrsUpdate` (`app/views/RoomView/constants.ts:3-13`) lists `'joined'` and `'loading'` but the exported array is **unused** (`grep -rn stateAttrsUpdate app` → only its own definition). Note it; optionally drop the dead field names, but do not chase removing the whole constant in this plan unless trivially safe.

### Consumers of `loading` / `joined` (migrate all)

`loading` (read as `s.loading`):

- `app/views/RoomView/components/RoomFooter/TakeOrJoin.tsx:16` → `disabled={loading}`.
- `app/views/RoomView/components/RoomFooter/OnHold.tsx:15` → `disabled={loading}`.
  (Note: `LoadMore/index.tsx` and `InvitedRoom.tsx` have their OWN unrelated `loading` — redux/prop — NOT this store field. Leave them.)

`joined` (read as `s.joined`):

- `app/views/RoomView/index.tsx:136` → `const joined = useStore(roomStore, s => s.joined)`, then passed to `useOmnichannelPermissions` (`:214`).
- `app/views/RoomView/hooks/useOmnichannelPermissions.ts:24,67` → param + effect dep.
- `app/views/RoomView/hooks/useGoRoomActionsView.ts:20,41,51` → `useRoomStoreByRid(rid, s => s.joined)`, passed onward.
- `app/views/RoomView/components/RoomFooter/useRoomFooterState.ts:16,25` → `const joined = useRoomStore(s => s.joined)`, `if (!joined) return { kind: 'takeOrJoin' }`.

`IUseOmnichannelPermissionsParams.joined: boolean` (`definitions.ts:363`) — a plain param, keep it `boolean` (derive from status at the index.tsx call site).

## Decision — the status union

Add to `definitions.ts`:

```ts
export type TRoomHydrationStatus =
	| 'loading' // init in flight; no subscription row confirmed yet
	| 'subscribed' // a subscription row exists (member of the room)
	| 'unsubscribed' // no subscription row (preview / not a member); non-DM => not joined
	| 'error'; // init threw
```

Map to the two booleans consumers actually need, as **derived** helpers (do NOT re-expose raw booleans on the store):

- `loading` ≡ `status === 'loading'`.
- `joined` ≡ `status !== 'unsubscribed'` (i.e. loading/subscribed/error all count as "joined-or-unknown"; only a confirmed no-row non-DM emit means not joined). This preserves today's semantics: `joined` starts `true`, flips `false` only on a no-row emit for non-`d` rooms, and DMs never flip.

Old→new state map:

| Old (`loading`,`subscribed`,`joined`)         | New `status`                                                                                                                                                                                                                                                        | Set at             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| initial `true`, `'id' in initialRoom`, `true` | `'loading'` (init always runs)                                                                                                                                                                                                                                      | RoomStore.ts:55-59 |
| init early-return on invite                   | `'loading'`→ stays; then success path                                                                                                                                                                                                                               | :74-77             |
| init success `false,_,_`                      | `'subscribed'` if a row exists else `'unsubscribed'`; but init doesn't know row state → set `status` to a non-loading terminal WITHOUT clobbering an observer-set subscription. **Use a dedicated `finishLoading()` that only downgrades `'loading'`** (see below). | :99                |
| init catch                                    | `'error'`                                                                                                                                                                                                                                                           | :102               |
| observe emit + row                            | `'subscribed'`                                                                                                                                                                                                                                                      | :135-137           |
| observe emit no row (non-d)                   | `'unsubscribed'`                                                                                                                                                                                                                                                    | :140               |
| observe emit no row (d)                       | keep prior non-loading status, treat as joined                                                                                                                                                                                                                      | :140               |

### The `loading`-vs-observer ordering subtlety (must get right)

Today `loading` and `subscribed`/`joined` are orthogonal booleans, so `init` freely sets `loading` while `observeRoom` independently sets `subscribed`. Collapsing into one `status` field means `init`'s "done loading" and the observer's "subscribed/unsubscribed" now write the SAME field and can race/clobber.

Resolution — split the concern in the union transitions:

- `observeRoom` is the **authority** on `subscribed`/`unsubscribed` and writes those terminal states directly.
- `init` only ever moves OUT of `loading`. On success it must not overwrite a subscription state the observer already set. Implement a guarded transition:
  ```ts
  const clearLoading = (set, get) => {
  	if (get().status === 'loading') set({ status: 'unsubscribed' }); // neutral terminal; observer upgrades to 'subscribed'
  };
  ```
  In practice the observer fires synchronously on subscribe (WatermelonDB emits current rows immediately), so by the time `init` awaits its async work the status is usually already `'subscribed'`/`'unsubscribed'`. The guard just prevents `init` from stomping it back. On `init` catch → `set({ status: 'error' })` unconditionally (an error overrides).

Confirm the emit-ordering assumption against `RoomStore.test.ts` (it drives the observer emit manually) — if the suite reveals init resolving before the first emit, the neutral-terminal guard still yields correct `loading=false`, and the next emit corrects `subscribed`.

## Change

1. **`definitions.ts`**: add `TRoomHydrationStatus`; in `RoomState` replace `joined`/`subscribed`/`loading` (`:167,168,171`) with `status: TRoomHydrationStatus`. Leave `IRoomViewState.joined`/`loading` (`:53,75`) and `IUseOmnichannelPermissionsParams.joined` (`:363`) as-is (separate prop/state shapes).
2. **`RoomStore.ts`**:
   - initial state (`:55-59`): drop the 3 booleans, add `status: 'loading'`.
   - `init` (`:71,75,99,102`): remove `set({ loading: … })`; on invite early-return and success use `clearLoading`; on catch `set({ status: 'error' })`. Keep the `get().joined` guard at `:90` working — replace with `get().status !== 'unsubscribed'`.
   - `join()` (`:106`): `set({ status: 'subscribed' })` (joining establishes a subscription).
   - `observeRoom` (`:135-140`): row → `set({ status: 'subscribed', room, roomUpdate })`; no row → `set({ status: t !== 'd' ? 'unsubscribed' : <keep> })`. For DMs with no row, do not downgrade a `'subscribed'`/terminal status to `'unsubscribed'`; only clear `'loading'` if still loading. Encode explicitly (small helper or inline conditional).
   - Add exported derived selectors for consumers (see step 3): keep them colocated with the store, e.g. in `RoomStoreContext.tsx` or as plain selector fns.
3. **Consumer migration** — add derived hooks and swap call sites:
   - In `RoomStoreContext.tsx` add:
     ```ts
     export const useRoomLoading = (): boolean => useRoomStore(s => s.status === 'loading');
     export const useRoomJoined = (): boolean => useRoomStore(s => s.status !== 'unsubscribed');
     ```
   - `TakeOrJoin.tsx:16` / `OnHold.tsx:15`: `const loading = useRoomStore(s => s.loading)` → `const loading = useRoomLoading()`.
   - `useRoomFooterState.ts:16`: `const joined = useRoomStore(s => s.joined)` → `const joined = useRoomJoined()`.
   - `index.tsx:136`: `const joined = useStore(roomStore, s => s.joined)` → `useStore(roomStore, s => s.status !== 'unsubscribed')`.
   - `useGoRoomActionsView.ts:20`: `useRoomStoreByRid(rid, s => s.joined)` → `useRoomStoreByRid(rid, s => s.status !== 'unsubscribed')`.
   - `useOmnichannelPermissions.ts`: keeps receiving `joined: boolean` as a param (derived at the index.tsx call site) — no signature change.
4. **`constants.ts`**: remove `'joined'` and `'loading'` from `stateAttrsUpdate` (they no longer exist on `RoomState`; tsc will error otherwise). Since the array is unused, this is safe; do not remove the array itself.

## Scope

- **In scope:** `definitions.ts`, `RoomStore.ts`, `RoomStoreContext.tsx`, `constants.ts`, `TakeOrJoin.tsx`, `OnHold.tsx`, `useRoomFooterState.ts`, `useGoRoomActionsView.ts`, `index.tsx`, and their `__tests__`.
- **Out of scope — do not touch:** `LoadMore/index.tsx` / `InvitedRoom.tsx` (unrelated `loading`); `IRoomViewState`/redux `state.room`; the registry lifetime code; any `app/containers/` file.

## Verification / done criteria

1. `pnpm lint` → exits 0.
2. `TZ=UTC pnpm test` → full suite green (esp. `RoomStore`, `useRoomFooterState`, `useOmnichannelPermissions`, `useGoRoomActionsView`, `RoomFooter`).
3. `grep -rn "s.subscribed\|s\.joined\|s\.loading" app/views/RoomView --include=*.ts --include=*.tsx | grep -v __tests__` → empty (no raw boolean reads remain; all via `status`/derived hooks).
4. `git grep -n "subscribed:" app/views/RoomView/stores/RoomStore.ts` → empty.
5. No `any` introduced.

## Test plan

- **`RoomStore.test.ts`**: update assertions that read `loading`/`subscribed`/`joined` to read `status`. Add cases:
  - initial `status === 'loading'`.
  - observer emit with a row → `'subscribed'`; a subsequent no-row emit for a non-DM → `'unsubscribed'`; for a DM → NOT downgraded.
  - `init` success clears loading without clobbering an observer-set `'subscribed'` (drive emit before/after resolving to cover both orderings).
  - `init` throw → `'error'`.
- **`useRoomFooterState.test.ts`**: cases already exercise `joined` true/false — repoint to `status`.
- Add small tests for `useRoomLoading`/`useRoomJoined` (or fold into RoomFooter component tests).

## Escape hatches

- If the observer-vs-init ordering assumption (WatermelonDB emits current rows synchronously on subscribe) proves false in the test harness such that `init`'s neutral-terminal clobbers a real `'subscribed'`, STOP and report — the fix is to make `clearLoading` a strict `'loading' → terminal` guard (already specified) and let the next emit correct it, but confirm before loosening.
- If any consumer needs to distinguish `'error'` from `'unsubscribed'` for UI (none identified today), STOP and surface — the union now makes that possible but this plan intentionally maps both into existing boolean behavior.
- If React Compiler skips a changed file that it didn't before (plan-011 guardrail), STOP and report.
