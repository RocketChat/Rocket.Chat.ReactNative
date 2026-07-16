# 015 — Make `useJumpToMessage.ts` compile: hoist the try/catch body to a module-scope impl

- **Status:** DONE `8ee630b06`
- **Priority:** P1
- **Effort:** S
- **Risk:** Low (single hook file; target content pre-verified to compile, lint and format clean; behavior tests unchanged)
- **Planned at:** `a29e7c52c`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. React 19 + **React Compiler** (`babel-plugin-react-compiler`, `compilationMode: 'annotation'` — `'use memo'` functions get compiled, including under jest). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest, `TZ=UTC pnpm test`.

**The problem:** `app/views/RoomView/hooks/useJumpToMessage.ts` carries `'use memo'` but the compiler silently skips it with `Todo: Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement` — the `jumpToMessage` body has optional chaining (`listRef.current?.…`), `??`, and `&&` expressions inside its try/catch.

**The fix (same pattern as plan 013 / commit `eb14e7d43`):** hoist the entire `jumpToMessage` body — try/catch included — to a module-scope `jumpToMessageImpl` taking an explicit context object. The compiled hook keeps only two thin arrows (`cancelJumpToMessage` and a `jumpToMessage` that forwards to the impl); no try/catch remains inside the compiled function. Module functions are also eslint-stable, so no dep-array concerns. Behavior byte-identical: the impl body is the old body unchanged, `shouldNavigateToRoom` moves with it.

**The exact target content below was pre-verified**: compiles under the real plugin with `panicThreshold: 'all_errors'` (output imports `react/compiler-runtime`), zero eslint findings at its real path, prettier-clean.

## Change

### 1. `app/views/RoomView/hooks/useJumpToMessage.ts` — replace ENTIRE file content with:

```ts
import { type RefObject } from 'react';

import I18n from '../../../i18n';
import { sendLoadingEvent } from '../../../containers/Loading';
import log from '../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { loadSurroundingMessages } from '../../../lib/methods/loadSurroundingMessages';
import { type IListContainerRef } from '../List/definitions';
import RoomServices from '../services';
import { resolveJumpAnchor } from '../services/resolveJumpAnchor';
import { type TGetMessageInfoResult } from '../services/getMessageInfo';

export interface IUseJumpToMessageParams {
	rid?: string;
	tmid?: string;
	t?: string;
	listRef: RefObject<IListContainerRef | null>;
	navToRoom: (message: TGetMessageInfoResult) => void;
	navToThread: (message: TGetMessageInfoResult) => void;
}

export interface IUseJumpToMessageResult {
	jumpToMessage: (messageId: string, isFromReply?: boolean) => Promise<void>;
	cancelJumpToMessage: () => void;
}

interface IJumpToMessageContext extends IUseJumpToMessageParams {
	cancelJumpToMessage: () => void;
}

const jumpToMessageImpl = async (
	{ rid, tmid, t, listRef, navToRoom, navToThread, cancelJumpToMessage }: IJumpToMessageContext,
	messageId: string,
	isFromReply?: boolean
) => {
	const shouldNavigateToRoom = (message: TGetMessageInfoResult) => {
		if (message.tmid && message.tmid === tmid) {
			return false;
		}
		if (!message.tmid && message.rid === rid) {
			return false;
		}
		return true;
	};

	try {
		sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessage });
		const message = await RoomServices.getMessageInfo(messageId);

		if (!message) {
			cancelJumpToMessage();
			return;
		}

		if (shouldNavigateToRoom(message)) {
			if (message.rid !== rid) {
				navToRoom(message);
			} else {
				navToThread(message);
			}
		} else if (!message.tmid && message.rid === rid && t === 'thread' && !message.replies) {
			/**
			 * if the user is within a thread and the message that he is trying to jump to, is a message in the main room
			 */
			return navToRoom(message);
		} else {
			/**
			 * if it's from server, we don't have it saved locally and so we fetch surroundings
			 * we test if it's not from threads because we're fetching from threads currently with `loadThreadMessages`
			 *
			 * The fetched Chunk lets us re-anchor the Message Window onto the target in ONE step: if a
			 * Newer Loader brackets the target's Chunk it is non-contiguous with the Live Tail, so we
			 * derive a finite upper ts bound (highTs) for an Anchored Window centered on it. A
			 * contiguous target resolves to null and stays a Live Window. Thread/local targets are
			 * never anchored.
			 */
			const inWindow = listRef.current?.isMessageInWindow(message.id) ?? false;
			const highTs = await resolveJumpAnchor(
				rid,
				{ id: message.id, tmid: message.tmid, ts: message.ts, fromServer: message.fromServer },
				inWindow,
				{ loadSurroundingMessages, getLocalAnchorTs: RoomServices.getLocalAnchorTs }
			);
			// Synchronization needed for Fabric to work
			await new Promise(res => setTimeout(res, 100));
			// The list hook resolves on real completion (or via its own safety net), so we no longer
			// race a 5s timeout that could yank a valid in-flight scroll.
			await listRef.current?.jumpToMessage(message.id, highTs);
			sendLoadingEvent({ visible: false });
		}
	} catch (error: any) {
		if (isFromReply && error.data?.errorType === 'error-not-allowed') {
			showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
		} else {
			log(error);
		}
		cancelJumpToMessage();
	}
};

export function useJumpToMessage({
	rid,
	tmid,
	t,
	listRef,
	navToRoom,
	navToThread
}: IUseJumpToMessageParams): IUseJumpToMessageResult {
	'use memo';

	const cancelJumpToMessage = () => {
		listRef.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const jumpToMessage = (messageId: string, isFromReply?: boolean) =>
		jumpToMessageImpl({ rid, tmid, t, listRef, navToRoom, navToThread, cancelJumpToMessage }, messageId, isFromReply);

	return { jumpToMessage, cancelJumpToMessage };
}
```

The diff vs current is ONLY: the `jumpToMessage` body (incl. `shouldNavigateToRoom` and the try/catch, all bodies unchanged) moves to module-scope `jumpToMessageImpl` with an `IJumpToMessageContext` param; the hook's `jumpToMessage` becomes a thin forwarder. No logic edits.

### 2. `app/views/RoomView/reactCompilerContract.test.ts`

Remove the `'app/views/RoomView/hooks/useJumpToMessage.ts'` entry (with its comment) from `KNOWN_SKIPPED`. Do not touch the other 2 entries (`useRoomLifecycle.ts`, `useScroll.ts`).

## Scope

- **In scope:** the two files above only.
- **Out of scope — do not touch:** `useJumpToMessage.test.tsx` (must pass UNCHANGED — it's the behavior contract; it mocks module boundaries only, so the hoist is transparent to it), the other 2 KNOWN_SKIPPED files, `useRoomNavigation.ts`, `index.tsx`, `babel.config.js`, eslint config.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='reactCompilerContract'` → passes. If it fails naming `useJumpToMessage.ts`, STOP and report the compiler error.
2. `TZ=UTC pnpm test --testPathPattern='useJumpToMessage'` → all 9 tests pass UNCHANGED. A failure is a REAL regression — STOP and report; do not edit the test.
3. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → exactly `✖ 174 problems (0 errors, 174 warnings)` (baseline after `a29e7c52c`). Any count above 174: STOP, report verbatim.
4. `npx tsc` → exit 0. (Plain `pnpm lint` may fail in a nested worktree — use the split commands.)
5. `TZ=UTC pnpm test` → full suite passes.
6. `git diff --stat` → exactly the 2 in-scope files.

## Test plan

Existing `useJumpToMessage.test.tsx` (9 tests covering in/out-of-window jumps, cancellation, room/thread navigation, error paths) is the behavior contract and must pass unmodified. The contract test's ratchet is the compile-level proof. No new tests.

## Maintenance note

The impl must stay module-scope: try/catch bodies containing optional chaining/`??`/`&&` cannot yet be compiled inside a `'use memo'` function (compiler Todo). New logic belongs in `jumpToMessageImpl` (or another module function), not in the hook body.

## Escape hatches

- Each done criterion above carries its STOP condition.
- If the current files at your checkout differ from the pre-edit state described (drift from `a29e7c52c`), STOP and report.
- Do not wait passively on background tasks — run all verification in the foreground.
