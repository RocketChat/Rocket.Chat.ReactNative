# 020 — Dedupe RoomView handlers into services (thread-nav, send, reaction) + fix `console.log` catches

- **Status:** TODO
- **Priority:** P2
- **Effort:** M
- **Risk:** Medium (touches live navigation/send/reaction paths; guarded by new + existing suites)
- **Planned at:** `HEAD` (branch `native-34-roomview-hooks`)

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Jest (`TZ=UTC pnpm test`), `@testing-library/react-native`. Prettier: tabs, single quotes, 130 width, no trailing commas. Repo rules: catches log via `log(e)` (never `console.log`); DB tests mock `database.active` (never LokiJS); `'use memo'` (React Compiler) instead of manual memoization.

This branch decomposed `RoomView` from a class into hooks + `stores/` + `services/`. The `services/` dir holds plain async functions (no React) — e.g. `toggleFollowThread.ts`, `fetchThreadName.ts`, `blockAction.ts`, `jumpToMessage.ts`. That is the home for extracted logic here. **`services/` currently has no `__tests__/` dir** — this plan adds the first service unit tests (mirror the colocated `anchorResolver.test.ts` / `getLocalAnchor.test.ts` style: colocated `*.test.ts`, not a `__tests__/` folder).

Three handler pairs are duplicated across the RoomView hooks, plus three catch blocks use `console.log`. Read all touched files before editing.

### Duplicate A — thread navigation (~40 lines, already drifting)

`navToThread` in `app/views/RoomView/hooks/useRoomNavigation.ts:50-103` and `onThreadPress` in `app/views/RoomView/hooks/useRoomMessageHandlers.tsx:79-132` are near-identical. **Drift already exists:** the navigation copy passes a cancel button —

```ts
// useRoomNavigation.ts:62
sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessageRef.current });
```

— while the handlers copy renders the overlay with **no** cancel button:

```ts
// useRoomMessageHandlers.tsx:91-92
// No orchestrator-owned cancelJumpToMessageRef to self-source here, so the loading overlay renders without a cancel button.
sendLoadingEvent({ visible: true });
```

Other differences: navigation copy accepts `TAnyMessageModel | { tmid: string } | TGetMessageInfoResult` and reads `roomUserIdRef.current`; handlers copy accepts `TAnyMessageModel` and reads a plain `roomUserId` (from `useRoomStore`). Both push `RoomView` with identical param shapes for the `item.tmid` branch and the `'tlm' in item` branch.

### Duplicate B — send flow (+ two error/analytics bugs)

`handleSendMessage` in `app/views/RoomView/hooks/useRoomActions.ts:9-19` and `onAnswerButtonPress` in `app/views/RoomView/hooks/useRoomMessageHandlers.tsx:221-231`:

```ts
// useRoomActions.ts:9-19
const handleSendMessage = (message?: string, tshow?: boolean) => {
	if (message === undefined) return;
	logEvent(events.ROOM_SEND_MESSAGE); // fires BEFORE send → counts attempts, not sends
	sendMessage(rid as string, message, tmid, userRef.current, tshow).then(() => {
		roomStore.getState().markMessageSent();
		Review.pushPositiveEvent();
	}); // no .catch → unhandled rejection
	resetAction();
};
```

`onAnswerButtonPress` is the same shape (reads `rid`/`user`/`tmid` from the hook, no `rid as string` cast). **Both have two defects** (arch-errors P1): `sendMessage().then()` has no `.catch` (unhandled rejection), and `logEvent` fires pre-send so analytics count attempts while `pushPositiveEvent` counts successes — they disagree.

### Duplicate C — reaction handlers (byte-identical)

`onReactionPress` + `onReactionClose` in `app/views/RoomView/hooks/useMessageActions.tsx:98-117` and `app/views/RoomView/hooks/useRoomMessageHandlers.tsx:177-196` are byte-identical:

```ts
const onReactionClose = () => {
	resetAction();
	hideActionSheet();
};
const onReactionPress = async (emoji: IEmoji, messageId: string) => {
	try {
		let shortname = '';
		if (typeof emoji === 'string') shortname = emoji;
		else shortname = emoji.name;
		await setReaction(shortname, messageId);
		onReactionClose();
		Review.pushPositiveEvent();
	} catch (e) {
		log(e);
	}
};
```

`resetAction` and `hideActionSheet` differ per call site by binding only (both `resetAction` = `messageActionStore.getState().actions.clear()`; `hideActionSheet` from `useActionSheet`).

### `console.log` → `log` (arch-errors P1)

Three catch blocks use `console.log` (invisible in prod telemetry):

- `app/views/RoomView/stores/RoomStore.ts:92` — `readMessages(...).catch(e => console.log(e))`. `log` is **already imported** (line 10).
- `app/views/RoomView/hooks/useSubscriptionUnreads.ts:35` — `.catch(() => console.log("Can't find subscription to observe."))`. `log` **not** imported.
- `app/views/RoomView/hooks/useThreadFollowing.ts:25` — `.catch(() => console.log("Can't find message to observe."))`. `log` **not** imported.

## Change

### 1. `console.log` → `log` (do this first — smallest, independent)

- `RoomStore.ts:92`: `.catch(e => console.log(e))` → `.catch((e: unknown) => log(e))`.
- `useSubscriptionUnreads.ts`: add `import log from '../../../lib/methods/helpers/log';`, then `.catch((e: unknown) => log(e))` (drop the string literal — `log` takes the error; the message added nothing telemetry can use).
- `useThreadFollowing.ts`: same import + `.catch((e: unknown) => log(e))`.

### 2. Duplicate A → `services/navigateToThread.ts`

New service owning the whole thread-nav body, with an **optional `onCancel`** to preserve the drift on purpose (navigation caller passes it, handlers caller omits → overlay simply has no cancel button, same as today). Signature:

```ts
import { type NavigationProp } from '@react-navigation/native';
// ... I18n, getThreadById, getThreadName, sendLoadingEvent, makeThreadName, E2E_*, SubscriptionType, TAnyMessageModel, TGetMessageInfoResult

type TThreadNavItem = TAnyMessageModel | { tmid: string } | TGetMessageInfoResult;

export const navigateToThread = async ({
	navigation,
	rid,
	roomUserId,
	item,
	onCancel
}: {
	navigation: IRoomViewProps['navigation'];
	rid?: string;
	roomUserId?: string;
	item: TThreadNavItem;
	onCancel?: () => void;
}): Promise<void> => {
	if (!rid) return;
	// ...body lifted verbatim from useRoomNavigation.ts:51-102, with:
	//   sendLoadingEvent({ visible: true, onCancel });   // undefined onCancel === no cancel button
	//   roomUserId  (instead of roomUserIdRef.current / roomUserId closure)
};
```

Then:

- `useRoomNavigation.ts`: replace the `navToThread` body with a thin forwarder that passes `navigation`, `rid`, `roomUserId: roomUserIdRef.current`, `onCancel: cancelJumpToMessageRef.current`. Keep `navToThread` in the returned object and keep it as the arg passed to `useJumpToMessage` and `onThreadPress` (`useDebounce`) — signatures unchanged.
- `useRoomMessageHandlers.tsx`: replace the `onThreadPress` body (lines 79-132) with a forwarder passing `navigation`, `rid`, `roomUserId`, **no** `onCancel`. Drop now-unused imports (`getThreadById`, `getThreadName`, `makeThreadName`, `I18n`, `sendLoadingEvent`, `E2E_*`, `SubscriptionType`) **only if** no other code in the file still uses them — grep each before removing.

Verify the param-shape identity between the two old copies is exact before collapsing (they are, per the read above — `item.tmid` branch + `'tlm' in item` branch push the same `RoomView` params).

### 3. Duplicate B → `services/sendRoomMessage.ts`

```ts
import { events, logEvent } from '../../../lib/methods/helpers/log';
import log from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { sendMessage } from '../../../lib/methods/sendMessage';
import { type TRoomStore } from '../stores/RoomStore'; // the store instance type; confirm exact export name

export const sendRoomMessage = ({
	rid,
	message,
	tmid,
	user,
	tshow,
	roomStore
}: { rid: string; message: string; tmid?: string; user: ...; tshow?: boolean; roomStore: TRoomStore }): void => {
	sendMessage(rid, message, tmid, user, tshow)
		.then(() => {
			logEvent(events.ROOM_SEND_MESSAGE);   // MOVED: fire on success, so analytics agree with pushPositiveEvent
			roomStore.getState().markMessageSent();
			Review.pushPositiveEvent();
		})
		.catch((e: unknown) => log(e));            // ADDED: no more unhandled rejection
};
```

- The `message === undefined` guard stays in each **caller** (they short-circuit before building args). `resetAction()` also stays in each caller (post-dispatch UI concern, not part of the send).
- `useRoomActions.ts`: `handleSendMessage` becomes guard → `sendRoomMessage({ rid: rid as string, message, tmid, user: userRef.current, tshow, roomStore })` → `resetAction()`.
- `useRoomMessageHandlers.tsx`: `onAnswerButtonPress` becomes guard → `sendRoomMessage({ rid, message, tmid, user, tshow, roomStore })` → `resetAction()`.
- Resolve the `user` type from `sendMessage`'s existing signature (do not introduce `any`). Resolve `roomStore`/`TRoomStore` from the store module's exported type — if it isn't exported, STOP and report (do not add an export outside this plan's scope without noting it).

### 4. Duplicate C → `services/reactToMessage.ts` (or a shared hook)

Because the only per-site variation is the `onClose` binding, extract a service taking `onClose`:

```ts
export const reactToMessage = async ({
	emoji,
	messageId,
	onClose
}: {
	emoji: IEmoji;
	messageId: string;
	onClose: () => void;
}): Promise<void> => {
	try {
		const shortname = typeof emoji === 'string' ? emoji : emoji.name;
		await setReaction(shortname, messageId);
		onClose();
		Review.pushPositiveEvent();
	} catch (e) {
		log(e);
	}
};
```

- Both hooks keep their own `onReactionClose = () => { resetAction(); hideActionSheet(); }` (it wires local `resetAction`/`hideActionSheet`), and `onReactionPress = (emoji, messageId) => reactToMessage({ emoji, messageId, onClose: onReactionClose })`.
- Preserve the returned function identities/names in both hooks (`onReactionPress`, `onReactionClose`) — consumers reference them by name.

## Scope

- **In scope:** three new files under `app/views/RoomView/services/` + colocated `*.test.ts`; edits to `useRoomNavigation.ts`, `useRoomMessageHandlers.tsx`, `useRoomActions.ts`, `useMessageActions.tsx`, `RoomStore.ts`, `useSubscriptionUnreads.ts`, `useThreadFollowing.ts`.
- **Out of scope — do not touch:** `useJumpToMessage.ts`, `goRoom.ts`, the send/reaction REST layer, the `roomUpdate`/refcount store internals, any behavior beyond the three fixes (the moved `logEvent` and added `.catch` are the only intended behavior changes; the thread-nav cancel-button drift is preserved deliberately).

## Verification / done criteria

1. `pnpm lint` → exits 0 (and eslint warning baseline does not rise above 171 — the manual-memo-free service files add none; if it rises, STOP and report).
2. `TZ=UTC pnpm test --testPathPattern='navigateToThread|sendRoomMessage|reactToMessage|useRoomNavigation|useRoomMessageHandlers|RoomStore'` → passes.
3. `TZ=UTC pnpm test` → full suite green, no snapshot churn.
4. `grep -rn "console.log" app/views/RoomView` → empty.
5. The React-Compiler contract test (`reactCompilerContract`) still passes — extracting bodies to module-scope services must not re-skip any RoomView `'use memo'` file (KNOWN_SKIPPED stays empty). If a hook newly skips, STOP and report.

## Test plan

New colocated suites (mirror `anchorResolver.test.ts`):

- **`navigateToThread.test.ts`:** `item.tmid` branch pushes `RoomView` with the expected params (mock `navigation.push`, `getThreadById`, `getThreadName`, `sendLoadingEvent`); `onCancel` is forwarded into `sendLoadingEvent` when supplied and absent when omitted (this is the drift the extraction must preserve); early-returns when `rid` is undefined; `'tlm' in item` branch pushes with `makeThreadName(item)`.
- **`sendRoomMessage.test.ts`:** on resolve → `logEvent(ROOM_SEND_MESSAGE)` **and** `markMessageSent` **and** `pushPositiveEvent` all fire (assert `logEvent` fires in the success path, not before send); on reject → `log(e)` fires and no throw escapes (this is the regression guard for the added `.catch`).
- **`reactToMessage.test.ts`:** string emoji and `{name}` emoji both call `setReaction(shortname, messageId)`; success calls `onClose` then `pushPositiveEvent`; failure calls `log`, not `onClose`.

## Escape hatches

- If collapsing Duplicate A reveals a param-shape difference between the two copies not noted above, STOP and report — do not silently unify divergent nav params.
- If the send store instance type (`TRoomStore`) or the `sendMessage` `user` type isn't cleanly importable without an `any`, STOP and report rather than widening.
- If moving `logEvent` into the `.then` changes an existing analytics assertion in a current test, STOP and report (the move is intentional but the sign-off is the reviewer's).
