# 002 — Type ComposerStore properly (remove `any`, `Function`, stale FIXME)

- **Status:** TODO
- **Priority:** P1
- **Effort:** S
- **Risk:** Low (type-only change; runtime untouched)
- **Planned at:** `59f97b0ac`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. Prettier: tabs, single quotes, 130 width. Repo rule: never use `any` unless 100% necessary.

`app/views/RoomView/stores/ComposerStore.tsx` defines the state shared between `RoomView`/`ShareView` and the message composer. Three fields are untyped (lines 8-14):

```ts
export type ComposerState = {
	rid?: string;
	t?: string;
	tmid?: string;
	room: any; // FIXME: type it properly after we migrate RoomView to hooks
	sharing?: boolean;
	isAutocompleteVisible?: boolean;
	editCancel?: () => void;
	editRequest?: (message: any) => void;
	onRemoveQuoteMessage?: (messageId: string) => void;
	onSendMessage?: Function;
	...
};
```

The FIXME is stale: RoomView **is already migrated** to hooks on this branch. The real types are all known from the two mount sites and the consumers:

### Producers (what gets stored)

1. **RoomView** (`app/views/RoomView/index.tsx:431-445` via `app/views/RoomView/RoomProviders.tsx`): passes `room` typed `IRoomViewState['room']` (defined `app/views/RoomView/definitions.ts:32-46` — union of `TSubscriptionModel` and a scalar-params shape), `editRequest={onEditRequest}`, `onSendMessage={handleSendMessage}`.
   - `onEditRequest` signature (`app/views/RoomView/hooks/useMessageActions.tsx:50-54`):
     ```ts
     onEditRequest: (message: Pick<IMessage, 'id' | 'msg' | 'rid'> & { attachments?: IMessageEditAttachment[] }) => Promise<void>;
     ```
   - `handleSendMessage` signature (`app/views/RoomView/hooks/useRoomLifecycle.ts:65`): `(message: string, tshow?: boolean) => void`.
2. **ShareView** (`app/views/ShareView/index.tsx:396-404`): passes `room` typed `TSubscriptionModel` (state line 50), `onSendMessage={this.send}` where `send = async () => {...}` (line 246, zero params). No `editRequest`.

### Consumers (how it's called)

`app/containers/MessageComposer/MessageComposer.tsx`:

- `onSendMessage?.()` (line 119, sharing path — **zero args**)
- `onSendMessage?.(quoteMessage)` (line 165)
- `onSendMessage?.(textFromInput, alsoSendThreadToChannel)` (line 190)
- `editRequest?.({ id: action.messageId, msg: textFromInput, rid, attachments: updatedAttachments })` (line 131)

`app/containers/MessageComposer/components/ComposerInput.tsx`: `useComposerRoom()` → `getRoomTitle(room)`, `room?.t === 'l'`.

## Change

Edit `app/views/RoomView/stores/ComposerStore.tsx` only:

1. Add imports (type-only, match repo style `import { type X } from ...`):
   - `IRoomViewState` from `../definitions`
   - `IMessage`, `IMessageEditAttachment` from `../../../definitions`
2. Replace the three loose fields:

```ts
	room: IRoomViewState['room'];
	...
	editRequest?: (message: Pick<IMessage, 'id' | 'msg' | 'rid'> & { attachments?: IMessageEditAttachment[] }) => Promise<void>;
	...
	onSendMessage?: (message?: string, tshow?: boolean) => void;
```

3. Delete the `// FIXME: type it properly after we migrate RoomView to hooks` comment (migration done).

4. **Widen `handleSendMessage` in `app/views/RoomView/hooks/useRoomLifecycle.ts`** (this is required — under `strictFunctionTypes`, a required-param source `(message: string, ...)` is NOT assignable to an optional-param target `(message?: string, ...)`). Two spots:
   - Line 65 (the hook's return-type interface): `handleSendMessage: (message: string, tshow?: boolean) => void;` → `handleSendMessage: (message?: string, tshow?: boolean) => void;`
   - Line 152 (the implementation):
     ```ts
     	const handleSendMessage = (message?: string, tshow?: boolean) => {
     		if (message === undefined) {
     			return;
     		}
     		logEvent(events.ROOM_SEND_MESSAGE);
     ```
     Rest of the body unchanged. The guard uses `=== undefined` (not `!message`) so empty-string behavior is untouched. At runtime RoomView is never called with zero args (the zero-arg path only fires when `sharing` is true, i.e. ShareView), so the guard is unreachable in practice — it exists only to make the widened signature honest.
5. **Fix the 3 room fixtures in `app/views/RoomView/RoomProviders.test.tsx`** — the scalar member of `IRoomViewState['room']` requires `t`, so `{ rid: 'rid-1' }` no longer typechecks. Add `t: 'c'`:
   - Line 10: `const room = { rid: 'rid-1' };` → `const room = { rid: 'rid-1', t: 'c' };`
   - Line 40: `const rooms = [{ rid: 'rid-1' }, { rid: 'rid-2' }];` → `const rooms = [{ rid: 'rid-1', t: 'c' }, { rid: 'rid-2', t: 'c' }];`
   - Line 65: `room={{ rid: 'rid-1' }}` → `room={{ rid: 'rid-1', t: 'c' }}`

Notes on compatibility (why these exact types work — verify, don't re-derive):

- `onSendMessage` must have **all params optional** because the sharing path calls it with zero args; that's why step 4 widens RoomView's producer (ShareView's `async () => {...}` is already assignable — fewer params + `Promise<void>` → `void` return position).
- `TSubscriptionModel` (ShareView) is the first member of the `IRoomViewState['room']` union, so it's assignable.
- Consumers may now surface type errors if they relied on `any` (e.g. `ComposerInput` calling `getRoomTitle(room)`); if the error is a **narrowing** need (union member check like `'id' in room`), fix it in the consumer with the same `'id' in room` guard pattern used across `app/views/RoomView/index.tsx`. If it's a genuine incompatibility, see escape hatches.

## Scope

- **In scope:** `app/views/RoomView/stores/ComposerStore.tsx`; `app/views/RoomView/hooks/useRoomLifecycle.ts` (only the `handleSendMessage` widening in step 4); `app/views/RoomView/RoomProviders.test.tsx` (only the fixture `t` additions in step 5); minimal narrowing fixes in `app/containers/MessageComposer/MessageComposer.tsx` / `components/ComposerInput.tsx` **only if** `pnpm lint` (which runs tsc) reports errors caused by this typing.
- **Out of scope — do not touch:** runtime logic anywhere else; `RoomProviders.tsx`; `ShareView`; `useMessageActions.tsx`; any other `any` in the codebase.

## Verification / done criteria

1. `pnpm lint` → exits 0 (includes TypeScript compiler check).
2. `TZ=UTC pnpm test` → all suites pass.
3. `grep -n "any\|Function" app/views/RoomView/stores/ComposerStore.tsx` → no `any`, no bare `Function`.
4. `grep -n "FIXME" app/views/RoomView/stores/ComposerStore.tsx` → empty.

## Test plan

Type-only change; existing suites cover runtime. No new tests.

## Maintenance note

If a new `onSendMessage` call shape appears in `MessageComposer.tsx`, the store signature must widen with it — the store type is now the single source of truth for that contract.

## Escape hatches

- If typing `room` as `IRoomViewState['room']` causes more than ~5 downstream tsc errors, STOP and report the error list instead of loosening types or adding casts.
- If ShareView's `room` fails assignability (e.g. its `?? {}` default leaks an empty-object type), STOP and report — do not cast with `as`.
