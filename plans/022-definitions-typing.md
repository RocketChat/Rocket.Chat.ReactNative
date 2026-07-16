# 022 — Tighten `app/views/RoomView/definitions.ts` types (kill `any` / `Function`)

- **Status:** TODO
- **Priority:** P1
- **Effort:** S
- **Risk:** Low–Med (type-only; one required cast in RoomStore write path)
- **Planned at:** current HEAD of `native-34-roomview-hooks`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict (`strictFunctionTypes` on), pnpm. Prettier: tabs, single quotes, 130 width, no trailing commas. Repo rule: **never use `any` unless 100% necessary**; **never use bare `Function`**.

`app/views/RoomView/definitions.ts` is the shared type module for the (already hooks-migrated) RoomView. The architecture review (`plans/architecture-review-findings.md`, arch-types P1s, all confirmed present at HEAD) flagged five loose spots. Plan 002 already de-`any`'d the _composer_ store — these RoomView `any`/`Function` are untouched and orthogonal.

This plan is type-only. No runtime behavior changes. Fix each loose type, then compile the enumerated consumers.

## The five fixes

### 1. `roomUpdate` — `{[K in TRoomUpdate]?: any}` → `Partial<TSubscriptionModel>`

Current (`definitions.ts:69-71`):

```ts
	roomUpdate: {
		[K in TRoomUpdate]?: any;
	};
```

`TRoomUpdate = keyof TSubscriptionModel` (line 50) — the mapped type is exactly `Partial<TSubscriptionModel>` minus the `any`. Replace with:

```ts
roomUpdate: Partial<TSubscriptionModel>;
```

`TRoomUpdate` (line 50) stays — still used by `roomAttrsUpdate`/constants elsewhere. Do not delete it.

**Required write-path cast (arch-verify PARTIAL 4).** `RoomStore.ts:131-134` builds `roomUpdate` with a `reduce`:

```ts
			roomUpdate: roomAttrsUpdate.reduce((ret: IRoomViewState['roomUpdate'], attr) => {
				ret[attr] = (next as TSubscriptionModel)[attr];
				return ret;
			}, {}),
```

Once `roomUpdate` is `Partial<TSubscriptionModel>`, `ret[attr] = …` fails with **"Type … is not assignable to type 'never'"** — indexing/writing a `Partial<T>` through a _union_ key (`attr: keyof TSubscriptionModel`) collapses the assignment target to `never`. This is a known TS limitation, not a real unsoundness (read path is fully typed). Fix with a **localized write cast** — pick the minimal form that lints clean (executor confirms via `pnpm lint`):

```ts
			roomUpdate: roomAttrsUpdate.reduce<Partial<TSubscriptionModel>>((ret, attr) => {
				(ret as Record<TRoomUpdate, unknown>)[attr] = (next as TSubscriptionModel)[attr];
				return ret;
			}, {}),
```

- The typed `reduce<Partial<TSubscriptionModel>>` generic replaces the `(ret: IRoomViewState['roomUpdate'], …)` annotation.
- `as Record<TRoomUpdate, unknown>` is the write-target cast only; the value read `(next as TSubscriptionModel)[attr]` is unchanged.
- `as unknown as …` and `as any` are **not** acceptable here — `Record<TRoomUpdate, unknown>` keeps the key union honest.

Alternative if the executor prefers no `Record` cast (equivalent runtime, one end-cast):

```ts
			roomUpdate: Object.fromEntries(
				roomAttrsUpdate.map(attr => [attr, (next as TSubscriptionModel)[attr]])
			) as Partial<TSubscriptionModel>,
```

Either is fine; keep whichever lints clean with the smallest diff. Do not touch `RoomStore.ts:54` (`roomUpdate: {}`) — `{}` is assignable to `Partial<TSubscriptionModel>`.

### 2. `member: any` (`definitions.ts:72`) → typed user shape

Producer is `getRoomMember` (`RoomStore.ts:27-42`): returns `result.user` from `getUserInfo` (REST `users.info`) on the DM path, or `{}` otherwise. Type as:

```ts
member: Partial<IUser>;
```

Add `IUser` to the `../../definitions` type import block (lines 8-19). `{}` is assignable to `Partial<IUser>`. If `result.user` (from the SDK `users.info` call, currently loosely typed) is **not** assignable to `Partial<IUser>`, STOP and report the exact error rather than widening — do not fall back to `any`.

Consumer to compile: `useGoRoomActionsView.ts:19` reads `s.member` and forwards it into navigation params (`stacks/types.ts:53,77` declare `member?: any` — accepts anything, so no break). Tightening `stacks/types.ts` is **out of scope** (note it as optional follow-up).

### 3. Three `Function` callback props → real signatures

- **`replyBroadcast: Function;` (`definitions.ts:35`, on `IRoomViewProps`).** Producer `useRoomMessageHandlers.tsx:207` — `(message: IMessage) => void`. Consumer `Broadcast.tsx:25` calls `replyBroadcast?.(item)` (an `IMessage`). Change to:

  ```ts
  	replyBroadcast: (message: IMessage) => void;
  ```

  `IMessage` is already imported.

- **`renderRow: Function;` (`definitions.ts:149`, on `IListContainerProps`).** Producer `index.tsx:223` — `(item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => ReactElement`. Consumer `List/index.tsx:42` calls `renderRow(item, messages[index + 1], highlightedMessageId)`. Change to:

  ```ts
  renderRow: (item: TAnyMessageModel, previousItem: TAnyMessageModel, highlightedMessage?: string) => ReactElement;
  ```

  Add `type ReactElement` to the `react` import (line 1 currently imports `type RefObject`). `TAnyMessageModel` already imported. Reuse the existing `TMessageRowProps` shape names for consistency but a literal signature is fine.

- **`onJoin: Function;` (`definitions.ts:242`, on `IJoinCodeProps`).** Consumer `JoinCode.tsx:60` calls `onJoin()` (zero args). Producer `index.tsx:323` passes `onJoin={onJoin}` from `useRoomActions` (`onJoin: () => void`, definitions.ts:259). Change to:
  ```ts
  	onJoin: () => void;
  ```

### 4. `IUseMessageActionsResult` `any`/`Function` (`definitions.ts:278-279`)

```ts
	handleCloseEmoji: (action?: Function, params?: any) => any;
	handleShowActionSheet: (options: any) => void;
```

Implementations (`useMessageActions.tsx:38-49`):

- `handleCloseEmoji(action?, params?)` forwards to `messageComposerRef.current.closeEmojiKeyboardAndAction(action, params)` then `action(params)`. `action` is an action-sheet/error-sheet opener; `params` is the payload. `handleShowActionSheet` calls it with `(showActionSheet, options)` where `options: TActionSheetOptions`.
- Consumer `index.tsx:282` passes `closeEmojiAndAction={handleCloseEmoji}` into `MessageRoomProvider`.

Target:

```ts
	handleCloseEmoji: (action?: (params?: unknown) => void, params?: unknown) => void;
	handleShowActionSheet: (options: TActionSheetOptions) => void;
```

`TActionSheetOptions` is already imported (line 20). Verify the `closeEmojiAndAction` prop type on `MessageRoomProvider`/`MessageRoomStore` accepts this signature — if the provider declares a narrower/looser type, reconcile at the provider **only if** tsc errors (keep it minimal; do not chase into unrelated `any`). If `closeEmojiKeyboardAndAction`'s native ref signature forces a different `action` shape, match that shape instead of `unknown` — report if it needs `any`.

## Consumers to compile (enumerated — verify each after edits)

| Type changed                               | Consumers                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `roomUpdate`                               | `RoomStore.ts:131` (write cast), `index.tsx:135,193,213,266`, `RoomStoreContext.tsx:20`, `ComposerStore.tsx:40,54,74`, `RoomProviders.tsx:37`, `useE2EEStatus.ts:13`, `useReadOnly.ts:24`, `useOmnichannelPermissions.ts:64-66` (`.lastMessage?.token`/`.visitor`/`.status` — all real `TSubscriptionModel` fields, now type-checked), `useHeader.tsx:25,85`, `useRoomInit.ts:13,59-65` (`.status`) |
| `member`                                   | `RoomStore.ts:27,97,99` (producer), `useGoRoomActionsView.ts:19,38,52` (forwarded to nav params)                                                                                                                                                                                                                                                                                                    |
| `replyBroadcast`                           | `useRoomMessageHandlers.tsx:207,243`, `MessageRoomStore.tsx:171-172` (`useReplyBroadcast`), `Broadcast.tsx:16,25`                                                                                                                                                                                                                                                                                   |
| `renderRow`                                | `index.tsx:301` (producer), `List/index.tsx:11,42`                                                                                                                                                                                                                                                                                                                                                  |
| `onJoin`                                   | `index.tsx:323` (producer), `JoinCode.tsx:47,60`                                                                                                                                                                                                                                                                                                                                                    |
| `handleCloseEmoji`/`handleShowActionSheet` | `useMessageActions.tsx:38,47,182-183`, `index.tsx:167,282`                                                                                                                                                                                                                                                                                                                                          |

## Scope

- **In scope:** `app/views/RoomView/definitions.ts` (the five type edits); `app/views/RoomView/stores/RoomStore.ts` (only the `roomUpdate` reduce write-cast in fix 1); minimal narrowing/reconcile in an enumerated consumer **only if** `pnpm lint` reports an error caused by these type changes.
- **Out of scope — do not touch:** `stacks/types.ts` `member?: any` (optional follow-up, note only); any `any`/`Function` outside `definitions.ts`; runtime logic; composer store (plan 002 owns it); `ComposerStore.tsx` `roomUpdate` field (it inherits `IRoomViewState['roomUpdate']`, auto-fixed).

## Verification / done criteria

1. `pnpm lint` → exits 0 (includes tsc).
2. `TZ=UTC pnpm test` → all suites pass.
3. `grep -nE ':\s*any\b|:\s*Function\b|\bany\b' app/views/RoomView/definitions.ts` → no `any`, no bare `Function` (the mapped-type `[K in TRoomUpdate]?: any` is gone; `TRoomUpdate` alias stays).
4. `grep -n "Function" app/views/RoomView/definitions.ts` → empty.

## Test plan

Type-only; existing suites cover runtime. No new tests. If any enumerated consumer needed a narrowing guard, confirm its existing test still passes.

## Escape hatches

- If the `roomUpdate` write cast can't be made to lint clean without `any`/`as unknown as`, STOP and report the exact tsc error + the two cast forms tried.
- If `member: Partial<IUser>` produces a producer-side assignability error from `result.user`, STOP and report — do not widen to `any`.
- If `handleCloseEmoji` reconcile spreads to more than ~3 downstream tsc errors (provider signature mismatch cascade), STOP and report the error list instead of loosening.
