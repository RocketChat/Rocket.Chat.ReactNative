# 004 — Harden RoomStore: stuck-loading on missing rid, silent catch, rid-less registry sharing

- **Status:** TODO
- **Priority:** P2
- **Effort:** S
- **Risk:** Low-medium (touches store lifecycle; guarded by existing unit tests)
- **Planned at:** `59f97b0ac`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Zustand stores. Prettier: tabs, single quotes, 130 width. Tests: Jest, run `TZ=UTC pnpm test`; DB tests mock `database.active` (repo pattern — never introduce LokiJS).

File: `app/views/RoomView/stores/RoomStore.ts` (197 lines). It defines a rid-keyed, refcounted registry of room stores:

```ts
export const getOrCreateRoomStore = ({ rid, t, initialRoom, roomUserId }: IGetOrCreateRoomStoreParams): RoomStore => {
	const key = rid ?? '';
	const existing = registry.get(key);
	if (existing) {
		existing.refCount += 1;
		return existing.store;
	}
	const store = createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
	const unsubscribe = observeRoom(rid, t, store);
	registry.set(key, { store, unsubscribe, refCount: 1 });
	return store;
};

export const releaseRoomStore = (rid?: string): void => {
	const key = rid ?? '';
	...
};
```

And an `init` action (lines 84-119):

```ts
		init: async ({ tmid, onThreadMessagesLoaded }: IRoomStoreInitParams = {}) => {
			set({ loading: true });
			if (!rid) {
				return;
			}
			try {
				...
				set({ canAutoTranslate: nextCanAutoTranslate, member: nextMember, loading: false });
			} catch {
				set({ loading: false });
			}
		},
```

Three defects:

1. **Stuck loading:** when `rid` is undefined, `init` sets `loading: true` then early-returns — `loading` never goes back to `false`. Consumers gate UI on `loading` (e.g. `RoomFooter` disables buttons via `enabled={!loading}`).
2. **Silent catch:** the `catch {}` swallows the error entirely. Repo convention is `log(e)` — `log` is already imported in this file (`import log from '../../../lib/methods/helpers/log';`).
3. **Rid-less store sharing:** `key = rid ?? ''` means **every** caller without a `rid` shares one `''`-keyed registry entry — two unrelated rid-less RoomViews (edge: deep link before subscription resolves) would share state, and refcounts from unrelated screens interleave. A rid-less store has no DB observer anyway (`observeRoom` returns a no-op for undefined rid), so registry sharing buys nothing.

Existing test file: `app/views/RoomView/stores/RoomStore.test.ts` — uses `__resetRoomStoreRegistryForTests()` between cases; follow its structure and mocking for new tests.

## Change

All in `app/views/RoomView/stores/RoomStore.ts` (+ its test file):

1. **`init` ordering:** move the `!rid` check above the `set({ loading: true })`, returning before touching state:
   ```ts
   		init: async ({ tmid, onThreadMessagesLoaded }: IRoomStoreInitParams = {}) => {
   			if (!rid) {
   				return;
   			}
   			set({ loading: true });
   ```
   Note: initial state already has `loading: true` (line 76). That initial `true` is fine — the defect is only that a rid-less `init` re-asserts it and nothing ever clears it. With the reorder, a rid-less store simply keeps whatever loading state it has; combined with fix 3 that store is unregistered and short-lived. If a consumer visibly hangs on a rid-less room, that's out of scope here (RoomView renders `!rid` fallbacks separately).
2. **Catch:** `catch {` → `catch (e) {` and add `log(e);` before `set({ loading: false });`.
3. **Registry guard:** in `getOrCreateRoomStore`, when `rid` is falsy, create and return an **unregistered** store (no registry entry, no observer bookkeeping):

   ```ts
   if (!rid) {
   	return createStore<RoomState>(createRoomState(rid, initialRoom, roomUserId));
   }
   const existing = registry.get(rid);
   ```

   Then drop the `?? ''` fallbacks: use `rid` directly as key in both `getOrCreateRoomStore` and `releaseRoomStore` (in `releaseRoomStore`, `if (!rid) return;` first). This keeps `releaseRoomStore(undefined)` a safe no-op — an unregistered store is torn down by GC; it holds no subscription (observeRoom no-op).

   Callers to verify unaffected (read them): `app/lib/methods/helpers/goRoom.ts:54-75` only warms when `routeParams.rid` truthy — unaffected. RoomView mount acquisition (grep `getOrCreateRoomStore` in `app/views/RoomView/`) — confirm its release path pairs with the same rid value.

## Scope

- **In scope:** `app/views/RoomView/stores/RoomStore.ts`, `app/views/RoomView/stores/RoomStore.test.ts`.
- **Out of scope — do not touch:** `goRoom.ts`, `RoomView/index.tsx`, `observeRoom` internals, refcount semantics for rid-keyed entries, `roomUpdate` snapshot logic.

## Verification / done criteria

1. `pnpm lint` → exits 0.
2. `TZ=UTC pnpm test --testPathPattern='RoomStore'` → passes, including new cases below.
3. `TZ=UTC pnpm test` → full suite passes.
4. `grep -n "?? ''" app/views/RoomView/stores/RoomStore.ts` → empty.

## Test plan

Add to `app/views/RoomView/stores/RoomStore.test.ts`, following its existing mock/reset pattern:

- `getOrCreateRoomStore` with `rid: undefined` twice → returns **two distinct** store instances (no sharing), and registry stays empty (a subsequent `releaseRoomStore(undefined)` is a no-op and doesn't throw).
- `init` on a rid-less store → resolves without setting `loading` to a new value and without throwing.
- `init` whose inner service throws → `loading` ends `false` and `log` was called (mock `../../../lib/methods/helpers/log`).

## Maintenance note

The registry contract is now: **only rid-keyed entries live in the registry**. Warm-up (`goRoom.ts`) and mount acquisition rely on acquire/release pairing per rid — any new caller must pair them the same way.

## Escape hatches

- If grepping shows a real caller that intentionally relies on rid-less stores being shared via the `''` key, STOP and report it — do not silently change its behavior.
- If existing RoomStore tests assert the `?? ''` behavior, STOP and report before rewriting them.
