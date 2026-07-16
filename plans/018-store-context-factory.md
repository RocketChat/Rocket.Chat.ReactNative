# 018 — Extract `createStoreContext(name)` factory for the 5 hand-rolled zustand context scaffolds

- **Status:** TODO
- **Priority:** P1
- **Effort:** M
- **Risk:** Medium (touches 5 store files + every consumer through re-exported hooks; guarded by existing suites)
- **Planned at:** `HEAD` of `native-34-roomview-hooks` (read the current file state before editing — line numbers below may drift)

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, `baseUrl` = `app/`. pnpm, Zustand, React 19 + React Compiler (`'use memo'`, babel-plugin-react-compiler). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest + `@testing-library/react-native`, run `TZ=UTC pnpm test`; DB tests mock `database.active` (repo pattern — never introduce LokiJS). Lint: `pnpm lint` (ESLint + tsc). Never add `Co-Authored-By` trailers.

Five zustand stores each hand-roll the **identical** scaffold: a nullable React context + a private `use<Name>Store(selector)` hook that reads the context, throws if absent, and returns `useStore(store, selector)`. The finding (arch-storelayer P1, `plans/architecture-review-findings.md:93`) is to extract a shared `createStoreContext(name)` factory. This is an **enabling refactor** — it standardizes the degrade-vs-throw policy that today is inconsistent (P2, findings:96).

> NOTE — this is NOT the rejected DEBT-03. DEBT-03 (findings:98) rejected extracting a shared _room+roomUpdate pairing_ hook. This plan extracts the _context+selector+throw_ scaffold, a different duplication (findings:93, explicitly congruent per findings:217). Do not conflate them.

### The 5 scaffolds (verify each before editing)

1. **`app/views/RoomView/stores/RoomStoreContext.tsx:6-14`** — `RoomStoreContext` + exported `useRoomStore`. Throws. (Also exports `useRoomWithUpdate`, unrelated — leave it.)
2. **`app/views/RoomView/stores/ComposerStore.tsx:17-25`** — `ComposerStoreContext` + private `useComposerStore`. Throws.
3. **`app/containers/message/stores/MessageActionStore.tsx:54-80`** — `MessageActionStoreContext` + private `useMessageActionStore` (throws) + a **degrade variant**: `useIsBeingEdited` (`:89-92`) reads `useContext(...) ?? inertStore` and never throws.
4. **`app/containers/message/stores/MessageRoomStore.tsx:42-50`** — `MessageRoomStoreContext` + private `useMessageRoomStore`. Throws.
5. **`app/containers/message/stores/MessageStore.tsx:50-58`** — `MessageStoreContext` + private `useMessageStore`. Throws.

The common shape:

```tsx
export const XStoreContext = createContext<XStore | null>(null);

const useXStore = <T,>(selector: (state: XState) => T): T => {
	const store = useContext(XStoreContext);
	if (!store) {
		throw new Error('… must be used within a XProvider');
	}
	return useStore(store, selector);
};
```

### Degrade-vs-throw — the policy this plan fixes

Two render-outside-provider paths deliberately **degrade instead of throw**:

- `MessageActionStore.useIsBeingEdited` → falls back to module-level `inertStore` (`MessageActionStore.tsx:72`) because search/pinned message rows render outside a `MessageActionProvider` and can never be editing.
- `RoomStore.useRoomStoreByRid` (`RoomStore.ts:235-244`) → falls back to `getFallbackRoomStore()`. **This one is registry-based, not context-based — OUT OF SCOPE for the factory** (it does not use `useContext`). Leave it exactly as is; it is only noted here so the policy is complete.

Everything else throws. The factory must make both stances first-class so future stores pick one explicitly rather than re-deriving the scaffold.

## Decision — factory API (degrade-vs-throw)

`createStoreContext(name)` returns:

- `Context` — the `createContext<Store | null>(null)`.
- `useStoreWithSelector(selector)` — the **throwing** accessor (default stance). Error message: `` `${name} hooks must be used within a ${name}Provider` `` (match existing wording per store where it matters — see migration notes; existing tests may assert on the string).
- `createFallbackSelector(fallbackStore)` — returns a **degrading** accessor `(selector) => useStore(useContext(Context) ?? fallbackStore, selector)`. The fallback store stays **store-owned** (each store keeps its own `inertStore` etc.); the factory only wires the `?? fallback` read. This keeps inert-store construction (which encodes store-specific no-op semantics) out of the generic factory.

Rationale: default-throw is the safe stance (a missing provider is a bug); degrade is opt-in and each degrade site must supply its own semantically-correct inert store. This is exactly the split the two real degrade sites already exhibit — the factory formalizes it without hiding the inert-store definition.

Typing: `createStoreContext<TState, TStore extends StoreApi<TState> = StoreApi<TState>>(name: string)`. The stores differ in their `Store` type (`RoomStore`, `ComposerStore`, `TMessageActionStore`, `MessageRoomStore`, `MessageStore`), all `StoreApi<State>` — the generic must carry both so `useStore` stays fully typed and no `any` leaks.

## Where the factory lives

New file: `app/lib/hooks/createStoreContext.tsx` (shared across `views/` and `containers/`; `app/lib/hooks/` is the repo's cross-cutting hook home — verify siblings like `useLiveRef.ts` exist there). Export `createStoreContext`. No React Compiler annotation on the factory itself (it is not a component/hook — it _returns_ hooks).

## Change — factory

Write `app/lib/hooks/createStoreContext.tsx`:

```tsx
import { createContext, useContext } from 'react';
import { type StoreApi, useStore } from 'zustand';

export const createStoreContext = <TState, TStore extends StoreApi<TState> = StoreApi<TState>>(name: string) => {
	const Context = createContext<TStore | null>(null);

	const useStoreWithSelector = <T,>(selector: (state: TState) => T): T => {
		const store = useContext(Context);
		if (!store) {
			throw new Error(`${name} hooks must be used within a ${name}Provider`);
		}
		return useStore(store, selector);
	};

	const createFallbackSelector =
		(fallbackStore: TStore) =>
		<T,>(selector: (state: TState) => T): T =>
			useStore(useContext(Context) ?? fallbackStore, selector);

	return { Context, useStoreWithSelector, createFallbackSelector };
};
```

Note: the returned functions are hooks (call `useContext`/`useStore`). Each consuming store MUST assign them to `use*`-named module consts so React's hook lint + the compiler recognize them (done in each migration below).

## Change — migrate each store

For every store: replace the hand-rolled `createContext` + private/exported `use*Store` throwing hook with factory output. **Keep the exported context symbol name** (`RoomStoreContext`, `ComposerStoreContext`, etc.) — providers and tests reference it. Keep every public selector hook's name and signature unchanged.

Per store:

1. **RoomStore** (`RoomStoreContext.tsx`):

   ```tsx
   const { Context: RoomStoreContext, useStoreWithSelector: useRoomStore } = createStoreContext<RoomState, RoomStore>('RoomStore');
   export { RoomStoreContext };
   export const useRoomStore = ... // re-export as before
   ```

   Actual shape: destructure, then `export const useRoomStore = <T,>(selector: (state: RoomState) => T) => ...`? Simpler — assign and export directly:

   ```tsx
   const roomStoreContext = createStoreContext<RoomState, RoomStore>('RoomStore');
   export const RoomStoreContext = roomStoreContext.Context;
   export const useRoomStore = roomStoreContext.useStoreWithSelector;
   ```

   `useRoomWithUpdate` stays (it calls `useRoomStore`). Existing throw message was `'Room store hooks must be used within a RoomStoreContext.Provider'`; new message will be `'RoomStore hooks must be used within a RoomStoreProvider'`. **Grep for tests asserting the old string** (`grep -rn "must be used within a RoomStoreContext" app`) — if any assert it, either pass the exact legacy name to `createStoreContext` or update the test. Prefer keeping tests honest: update the assertion.

2. **ComposerStore** (`ComposerStore.tsx`): `useComposerStore` is private (module-local). Replace with factory; keep `ComposerStoreContext` exported (the `ComposerProvider` uses `ComposerStoreContext.Provider`). All `useComposerRid` etc. keep calling the local `useComposerStore`.

3. **MessageActionStore** (`MessageActionStore.tsx`): private `useMessageActionStore` → factory throwing accessor. `useIsBeingEdited` → factory **degrade** accessor built from the existing `inertStore`:

   ```tsx
   const messageActionStoreContext = createStoreContext<MessageActionState, TMessageActionStore>('MessageActionStore');
   export const MessageActionStoreContext = messageActionStoreContext.Context;
   const useMessageActionStore = messageActionStoreContext.useStoreWithSelector;
   const useMessageActionStoreOrInert = messageActionStoreContext.createFallbackSelector(inertStore);
   // useIsBeingEdited(messageId) => useMessageActionStoreOrInert(s => s.action?.kind === 'edit' && s.action.messageId === messageId)
   ```

   `inertStore` must be declared **before** `createFallbackSelector(inertStore)` runs — it is a module-level `createStore` (already at `:72`), so just ensure ordering. Keep `inertStore` exported/defined exactly as today.

4. **MessageRoomStore** (`MessageRoomStore.tsx`): private `useMessageRoomStore` → factory throwing accessor. Providers/guards untouched.

5. **MessageStore** (`MessageStore.tsx`): private `useMessageStore` → factory throwing accessor. All the `useShallow`/`useMessageField` hooks keep calling local `useMessageStore`.

Remove now-unused `createContext`/`useContext`/`useStore` imports from each migrated file **only if** no other code in the file still needs them (MessageStore/MessageRoomStore still `useState`/`useEffect`/`useRef` from react and `createStore`/`useShallow` from zustand — trim precisely, let tsc/eslint confirm).

## Scope

- **In scope:** new `app/lib/hooks/createStoreContext.tsx`; the 5 store files listed; any test asserting an old throw-message string.
- **Out of scope — do not touch:** `RoomStore.ts`'s `useRoomStoreByRid`/`getFallbackRoomStore`/registry (registry-based degrade, not context); any provider component body (`ComposerProvider`, `MessageProvider`, `MessageRoomProvider`, `MessageActionProvider`) — their `'use memo'` and effects stay; the pairing hooks `useRoomWithUpdate`/`useComposerRoom` (DEBT-03, rejected); selector-hook signatures/names.

## Verification / done criteria

1. `pnpm lint` → exits 0 (watch for `react-hooks/rules-of-hooks` complaints on the factory-returned hooks — they are named `use*`, so this should pass; if it flags, STOP and report rather than suppressing).
2. `TZ=UTC pnpm test` → full suite green.
3. `grep -rn "createContext<.*| null>(null)" app/views/RoomView/stores app/containers/message/stores` → empty (all 5 scaffolds replaced).
4. `git diff --stat` → 1 new file + 5 store files (+ at most 1 test file for a throw-message update).
5. No `any` introduced (`git diff | grep -n ': any'` shows nothing new).

## Test plan

Add `app/lib/hooks/__tests__/createStoreContext.test.tsx`:

- Throwing accessor: render a probe calling `useStoreWithSelector` with NO provider → asserts it throws with the `${name}` message. Under a `Context.Provider value={store}` → returns the selected value and re-renders on `store.setState`.
- Degrade accessor: `createFallbackSelector(fallbackStore)` with no provider → reads from `fallbackStore` (no throw); with a provider → reads from the provided store.
  Existing store suites (`RoomStore.test.ts`, `MessageActionStore`/message store tests, `useRoomFooterState.test.ts`, etc.) cover the migrated consumers — they must stay green unchanged except the one possible throw-string assertion.

## React Compiler interplay (risk)

The factory returns closures that ARE hooks. Two concerns:

1. **Naming** — the compiler/lint identify hooks by the `use` prefix on the _call site binding_. Because each store assigns the factory output to `export const useRoomStore = ...` etc., call sites still invoke a `use*`-named function. Verified pattern; but the factory-internal names (`useStoreWithSelector`) also start with `use`, keeping rules-of-hooks happy inside the factory too.
2. **`'use memo'` providers untouched** — providers keep their hand-written bodies (distinct effects per store), so no compiled provider changes. If the compiler starts skipping any migrated store file (check via the plan-011 guardrail / `KNOWN_SKIPPED` list if that harness still exists), STOP and report — a scaffold refactor must not change the compiled/skip set.

## Escape hatches

- If TypeScript can't infer `TStore` cleanly and forces a cast at a call site, prefer widening the factory generic over an `as` cast; if a cast is truly unavoidable, STOP and report with the exact type error.
- If any existing test asserts the specific legacy throw message and updating it changes behavior expectations beyond the string, STOP and report.
- If `react-hooks/rules-of-hooks` or the React Compiler flags the factory-returned hooks, STOP and report the exact diagnostic — do not add eslint-disable or drop `'use memo'`.
