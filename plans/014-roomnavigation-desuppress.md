# 014 — Make `useRoomNavigation.ts` compile: `useDebounce` for the two debounced handlers + drop all manual memoization

- **Status:** DONE `a29e7c52c`
- **Priority:** P1
- **Effort:** S
- **Risk:** Low (single hook file + 1-line test-mock tracking edit; target content pre-verified to compile, lint and format clean)
- **Planned at:** `eb14e7d43`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. React 19 + **React Compiler** (`babel-plugin-react-compiler`, `compilationMode: 'annotation'` — `'use memo'` functions get compiled, including under jest). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest, `TZ=UTC pnpm test`.

**The problem:** `app/views/RoomView/hooks/useRoomNavigation.ts` carries `'use memo'` but the compiler silently skips the whole file, for TWO stacked reasons (verified against the real plugin with `panicThreshold: 'all_errors'`):

1. `Cannot access refs during render` — the two `useMemo(() => debounce(handler, 1000, true), [dep])` sites call the plain `debounce()` factory during render with closures that read refs. Conservative compiler analysis, not a runtime bug (the refs are read at event time), but it blocks compilation.
2. With (1) fixed, `Memoization: Compilation skipped because existing memoization could not be preserved` × 6 — the manual `useCallback` wrappers have dep arrays the compiler can't reproduce (e.g. `handleEnterCall` with `[]`, `navToThread` omitting the ref params), so it refuses to compile rather than change semantics.

**The fix (both at once):**

- Swap the two `useMemo(debounce(...))` sites to the repo's `useDebounce` hook (`app/lib/methods/helpers/debounce.ts` → wraps `useDebouncedCallback` from `use-debounce`) with `{ leading: true, trailing: false }` — semantically equivalent to the custom `debounce(fn, wait, true)` (leading-edge fire, later calls inside the window suppressed, timer resets per call).
- Strip every manual `useCallback`/`useMemo` wrapper to plain functions — the compiler memoizes them itself with correct deps. Same approach commit `34e17bf58` took for `index.tsx`.

**The exact target content below was pre-verified**: compiles under the real plugin with `panicThreshold: 'all_errors'` (output imports `react/compiler-runtime`), zero eslint findings at its real path, prettier-clean.

## Change

### 1. `app/views/RoomView/hooks/useRoomNavigation.ts` — replace ENTIRE file content with:

```ts
import { type RefObject } from 'react';
import parse from 'url-parse';
import { type NavigatorScreenParams } from '@react-navigation/native';

import { type TNavigation } from '../../../stacks/stackType';
import I18n from '../../../i18n';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { useDebounce } from '../../../lib/methods/helpers';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';
import { sendLoadingEvent } from '../../../containers/Loading';
import { callJitsi } from '../../../lib/methods/callJitsi';
import { isInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { type ISubscription, SubscriptionType, type TAnyMessageModel, type TSubscriptionModel } from '../../../definitions';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { type IListContainerRef } from '../List/definitions';
import { type TGetMessageInfoResult } from '../services/getMessageInfo';
import { type IRoomViewProps, type IRoomViewState } from '../definitions';
import { useJumpToMessage } from './useJumpToMessage';

export interface IUseRoomNavigationParams {
	rid?: string;
	tmid?: string;
	t?: string;
	navigation: IRoomViewProps['navigation'];
	isMasterDetail: boolean;
	listRef: RefObject<IListContainerRef | null>;
	member: IRoomViewState['member'];
	joined: boolean;
	canForwardGuest: boolean;
	canReturnQueue: boolean;
	canViewCannedResponse: boolean;
	canPlaceLivechatOnHold: boolean;
	roomRef: RefObject<IRoomViewState['room']>;
	roomUserIdRef: RefObject<string | null | undefined>;
	cancelJumpToMessageRef: RefObject<() => void>;
	pendingJumpRef: RefObject<string | undefined>;
}

export interface IUseRoomNavigationResult {
	navToRoom: (message: TGetMessageInfoResult) => Promise<void | undefined>;
	navToThread: (item: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult) => Promise<void | undefined>;
	jumpToMessage: (messageId: string, isFromReply?: boolean) => Promise<void>;
	cancelJumpToMessage: () => void;
	consumeJumpParam: (messageId: string) => void;
	onThreadMessagesLoaded: () => void;
	onDiscussionPress: (drid: TAnyMessageModel['drid']) => void;
	onThreadPress: (item: TAnyMessageModel) => void;
	jumpToMessageByUrl: (messageUrl?: string, isFromReply?: boolean) => Promise<void>;
	onEncryptedPress: () => void;
	navToRoomInfo: (navParam: any) => void;
	handleEnterCall: () => void;
	goRoomActionsView: (screen?: keyof ModalStackParamList) => void;
}

export function useRoomNavigation({
	rid,
	tmid,
	t,
	navigation,
	isMasterDetail,
	listRef,
	member,
	joined,
	canForwardGuest,
	canReturnQueue,
	canViewCannedResponse,
	canPlaceLivechatOnHold,
	roomRef,
	roomUserIdRef,
	cancelJumpToMessageRef,
	pendingJumpRef
}: IUseRoomNavigationParams): IUseRoomNavigationResult {
	'use memo';

	const navToRoom = async (message: TGetMessageInfoResult) => {
		if (!message.rid) return;
		const roomInfo = await getRoomInfo(message.rid);
		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			jumpToMessageId: message.id
		});
	};

	const navToThread = async (item: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult) => {
		if (!rid) {
			return;
		}

		if (item.tmid) {
			let name = '';
			let jumpToMessageId = '';
			if ('id' in item) {
				name = 'tmsg' in item ? (item.tmsg ?? '') : '';
				jumpToMessageId = item.id;
			}
			sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessageRef.current });
			const threadRecord = await getThreadById(item.tmid);
			if (threadRecord?.t === 'rm') {
				name = I18n.t('Thread');
			}
			if (!name) {
				const result = await getThreadName(rid, item.tmid, jumpToMessageId);
				// test if there isn't a thread
				if (!result) {
					sendLoadingEvent({ visible: false });
					return;
				}
				name = result;
			}
			if ('id' in item && 't' in item && item.t === E2E_MESSAGE_TYPE && 'e2e' in item && item.e2e !== E2E_STATUS.DONE) {
				name = I18n.t('Encrypted_message');
			}
			if (!jumpToMessageId) {
				setTimeout(() => {
					sendLoadingEvent({ visible: false });
				}, 300);
			}
			return navigation.push('RoomView', {
				rid,
				tmid: item.tmid,
				name,
				t: SubscriptionType.THREAD,
				roomUserId: roomUserIdRef.current,
				jumpToMessageId
			});
		}

		if ('tlm' in item) {
			return navigation.push('RoomView', {
				rid,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId: roomUserIdRef.current
			});
		}
	};

	const { jumpToMessage, cancelJumpToMessage } = useJumpToMessage({
		rid,
		tmid,
		t,
		listRef,
		navToRoom,
		navToThread
	});

	// Fire a jump from a Navigation param, then consume the one-shot param so re-selecting the SAME
	// message id reads as a change (undefined -> id edge) and re-fires, instead of matching a stale
	// param and no-opping. Both mount (initial param) and update (Search delivers via setParams) use this.
	const consumeJumpParam = (messageId: string) => {
		pendingJumpRef.current = undefined;
		jumpToMessage(messageId);
		navigation.setParams({ jumpToMessageId: undefined });
	};

	// Thread jump: fired from the subscription hook's success path — the thread window is populated by
	// then, so the row exists (a non-anchored thread jump otherwise aborts and parks on the live tail).
	const onThreadMessagesLoaded = () => {
		if (pendingJumpRef.current) {
			const messageId = pendingJumpRef.current;
			pendingJumpRef.current = undefined;
			consumeJumpParam(messageId);
		}
	};

	const onEncryptedPress = () => {
		logEvent(events.ROOM_ENCRYPTED_PRESS);
		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } };
		if (isMasterDetail) {
			// @ts-ignore
			return navigation.navigate('ModalStackNavigator', screen);
		}
		// @ts-ignore
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	};

	const onDiscussionPress = useDebounce(
		async (drid: TAnyMessageModel['drid']) => {
			if (!drid) return;
			const discussion = await getRoomInfo(drid);
			if (discussion) {
				goRoom({
					item: discussion as TGoRoomItem,
					isMasterDetail
				});
			}
		},
		1000,
		{ leading: true, trailing: false }
	);

	const onThreadPress = useDebounce((item: TAnyMessageModel) => navToThread(item), 1000, { leading: true, trailing: false });

	const jumpToMessageByUrl = async (messageUrl?: string, isFromReply?: boolean) => {
		if (!messageUrl) {
			return;
		}
		try {
			const parsedUrl = parse(messageUrl, true);
			const messageId = parsedUrl.query.msg;
			if (messageId) {
				await jumpToMessage(messageId, isFromReply);
			}
		} catch (e) {
			log(e);
		}
	};

	const navToRoomInfo = (navParam: any) => {
		logEvent(events[`ROOM_GO_${navParam.t === 'd' ? 'USER' : 'ROOM'}_INFO`]);
		navParam.fromRid = rid;
		if (isMasterDetail) {
			navParam.showCloseModal = true;
			// @ts-ignore
			navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: navParam });
		} else {
			navigation.navigate('RoomInfoView', navParam);
		}
	};

	// OLD METHOD - support versions before 5.0.0
	const handleEnterCall = () => {
		if (isInActiveVoipCall()) return;
		const currentRoom = roomRef.current;
		if ('id' in currentRoom) {
			const { jitsiTimeout } = currentRoom;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				callJitsi({ room: currentRoom });
			}
		}
	};

	const goRoomActionsView = (screen?: keyof ModalStackParamList) => {
		logEvent(events.ROOM_GO_RA);
		if (isMasterDetail) {
			// @ts-ignore — navigation types expect a literal screen name
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: rid as string,
					t: t as SubscriptionType,
					room: roomRef.current as ISubscription,
					member,
					showCloseModal: !!screen,
					// @ts-ignore
					joined,
					omnichannelPermissions: {
						canForwardGuest,
						canReturnQueue,
						canViewCannedResponse,
						canPlaceLivechatOnHold
					}
				}
			} as NavigatorScreenParams<ModalStackParamList & TNavigation>);
		} else if (rid && t) {
			navigation.push('RoomActionsView', {
				rid,
				t: t as SubscriptionType,
				room: roomRef.current as TSubscriptionModel,
				member,
				joined,
				omnichannelPermissions: {
					canForwardGuest,
					canReturnQueue,
					canViewCannedResponse,
					canPlaceLivechatOnHold
				}
			});
		}
	};

	return {
		navToRoom,
		navToThread,
		jumpToMessage,
		cancelJumpToMessage,
		consumeJumpParam,
		onThreadMessagesLoaded,
		onDiscussionPress,
		onThreadPress,
		jumpToMessageByUrl,
		onEncryptedPress,
		navToRoomInfo,
		handleEnterCall,
		goRoomActionsView
	};
}
```

The diff vs current is ONLY: (a) `useCallback`/`useMemo` wrappers unwrapped to plain functions (bodies byte-identical, re-indented one level), (b) the two debounce sites now `useDebounce(fn, 1000, { leading: true, trailing: false })`, (c) import line 1 drops `useCallback, useMemo`, import of `debounce` becomes `useDebounce`. No logic edits.

### 2. `app/views/RoomView/hooks/useRoomNavigation.test.ts` — ONE line only

Current line 21:

```ts
jest.mock('../../../lib/methods/helpers', () => ({ debounce: (fn: (...args: any[]) => any) => fn }));
```

Replace with:

```ts
jest.mock('../../../lib/methods/helpers', () => ({ useDebounce: (fn: (...args: any[]) => any) => fn }));
```

(The mock must track the renamed import; same pass-through semantics. Touch NOTHING else in this file — every assertion must pass unchanged.)

### 3. `app/views/RoomView/reactCompilerContract.test.ts`

Remove the `'app/views/RoomView/hooks/useRoomNavigation.ts'` entry (with its comment) from `KNOWN_SKIPPED`. Do not touch the other 3 entries.

## Scope

- **In scope:** the three files above, exactly the edits above.
- **Out of scope — do not touch:** the other 3 KNOWN_SKIPPED files (`useRoomLifecycle.ts`, `useScroll.ts`, `useJumpToMessage.ts`), `app/lib/methods/helpers/debounce.ts`, `index.tsx`, `babel.config.js`, eslint config.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='reactCompilerContract'` → passes. If it fails naming `useRoomNavigation.ts`, STOP and report the compiler error.
2. `TZ=UTC pnpm test --testPathPattern='useRoomNavigation'` → all tests pass with only the line-21 mock edit. Any other failure is a REAL regression — STOP and report; do not edit assertions.
3. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → exactly `✖ 174 problems (0 errors, 174 warnings)` — the old file carried 6 warnings (5 exhaustive-deps + 1 react-hooks/refs), all removed by the rewrite, so the repo baseline drops 180 → 174. Any count above 174: STOP, report verbatim.
4. `npx tsc` → exit 0. (Plain `pnpm lint` may fail in a nested worktree — use the split commands.)
5. `TZ=UTC pnpm test` → full suite passes.
6. `git diff --stat` → exactly the 3 in-scope files.

## Test plan

Existing `useRoomNavigation.test.ts` (at its 12-mock ceiling — do not add mocks) is the behavior contract; it now exercises the COMPILED hook. The contract test's ratchet is the compile-level proof. No new tests.

## Maintenance note

The debounced handlers must stay on `useDebounce` — a render-time `debounce()` factory call (even inside `useMemo`) re-triggers the compiler's ref-during-render bail. New handlers in this hook should be plain functions; the compiler owns memoization.

## Escape hatches

- Each done criterion above carries its STOP condition.
- If the current files at your checkout differ from the pre-edit state described (drift from `eb14e7d43`), STOP and report.
- Do not wait passively on background tasks — run all verification in the foreground.
