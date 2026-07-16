# 017 — Make `useRoomLifecycle.ts` compile: module impls + honest deps + mount-closure ref (last skipped file)

- **Status:** DONE `70f090f73`
- **Priority:** P1
- **Effort:** M
- **Risk:** Low-medium (single hook file + ratchet; target content pre-verified to compile, lint and format clean; 23-test behavior suite unchanged)
- **Planned at:** `535cc4920`

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm. React 19 + **React Compiler** (`babel-plugin-react-compiler`, `compilationMode: 'annotation'` — `'use memo'` functions get compiled, including under jest). Prettier: tabs, single quotes, 130 width, no trailing commas, arrow parens avoid. Tests: Jest, `TZ=UTC pnpm test`.

**The problem:** `app/views/RoomView/hooks/useRoomLifecycle.ts` carries `'use memo'` but the compiler silently skips it — it has 3 `react-hooks/exhaustive-deps` suppressions, and any such suppression makes the compiler skip the whole function. It is the LAST file in the contract test's `KNOWN_SKIPPED` list. The file also contributes 3 eslint warnings to the repo baseline (plain component functions `handleRoomRemoved`/`joinRoom`/`resumeRoom` listed in effect dep arrays).

**The fix (patterns from plans 013/015/016, commits `eb14e7d43`/`8ee630b06`/`535cc4920`):**

1. Hoist `joinRoom`/`resumeRoom`/`toggleFollowThread`/`handleRoomRemoved` bodies and the room-subscribe try/catch to module scope (try/catch with optional chaining can't be compiled inside a `'use memo'` fn; module fns are also eslint-stable). The hook keeps thin forwarders.
2. `runInit` becomes a module function taking `(roomStore, tmid, onThreadMessagesLoadedRef)`; the init effect and the INVITED effect get honest deps `[rid, isAuthenticated, roomStore, tmid]` / `[roomUpdate.status, roomStore, tmid]` (roomStore is paired with rid; tmid is route-stable; the INVITED body is guarded by a prev-status ref so extra fires no-op).
3. The mount effect keeps `[]` honestly: its body moves to a component-scope `mountRoom` closure frozen in `useRef(mountRoom)`, and the effect is `useEffect(() => mountRoomRef.current(), [])` — no reactive reads in the effect, so exhaustive-deps is satisfied. Semantics are byte-equivalent to the old suppressed version (first-render closure, cleanup at unmount with mount-time values). Honest deps here would RESUBSCRIBE the room/unload audio whenever `sub` or a handler identity changed mid-session — that's why `[]` is by design.
4. The ROOM_REMOVED listener effect builds its handler inside the effect from the module impl; deps `[rid, isMasterDetail, roomRef]`. (Old version had `[handleRoomRemoved]`, recreated every render → add/remove listener churn each render. New version subscribes only when inputs change.)
5. The store-publish effect builds `joinRoom`/`resumeRoom` closures inside the effect from the same module impls, with an effect-local `onStoreJoin`; deps `[roomStore, room, isOmnichannel, serverVersion, t, joinCodeRef]`. (Old version fired every render.) Freshness is preserved: the impls read `room` properties at call time and the model object is mutated in place; identity changes refire the effect.

**The exact target contents below were pre-verified**: the hook compiles under the real plugin with `panicThreshold: 'all_errors'` (output imports `react/compiler-runtime`), zero eslint findings at its real path, prettier-idempotent. The modified contract test also lints/formats clean.

## Change

### 1. `app/views/RoomView/hooks/useRoomLifecycle.ts` — replace ENTIRE file content with:

```ts
import { type RefObject, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { type Dispatch } from 'redux';
import { Q } from '@nozbe/watermelondb';
import { type Subscription } from 'rxjs';

import { clearInAppFeedback } from '../../../actions/inAppFeedback';
import { takeInquiry, takeResume } from '../../../ee/omnichannel/lib';
import I18n from '../../../i18n';
import database from '../../../lib/database';
import { getThreadById } from '../../../lib/database/services/Thread';
import AudioManager from '../../../lib/methods/AudioManager';
import { getRoomTitle, isIOS } from '../../../lib/methods/helpers';
import EventEmitter from '../../../lib/methods/helpers/events';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import getThreadName from '../../../lib/methods/getThreadName';
import { sendMessage } from '../../../lib/methods/sendMessage';
import type RoomClass from '../../../lib/methods/subscriptions/room';
import Navigation from '../../../lib/navigation/appNavigation';
import { joinRoom as joinRoomService, toggleFollowMessage } from '../../../lib/services/restApi';
import { type TMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import { LISTENER } from '../../../containers/Toast';
import { type IRoomViewProps, type IRoomViewState } from '../definitions';
import { type TRoomViewReducerState } from '../index';
import { type IJoinCode } from '../JoinCode';
import { type RoomStore } from '../stores/RoomStore';

export interface IUseRoomLifecycleParams {
	rid?: string;
	tmid?: string;
	t?: string;
	isAuthenticated: boolean;
	isMasterDetail: boolean;
	isOmnichannel: boolean;
	room: IRoomViewState['room'];
	roomUpdate: IRoomViewState['roomUpdate'];
	serverVersion?: string | null;
	roomStore: RoomStore;
	navigation: IRoomViewProps['navigation'];
	route: IRoomViewProps['route'];
	dispatch: Dispatch;
	messageActionStore: TMessageActionStore;
	sub?: RoomClass;
	queryUnreadsRef: RefObject<Subscription | null>;
	pendingJumpRef: RefObject<string | undefined>;
	jumpToThreadIdRef: RefObject<string | undefined>;
	unreadsCountRef: RefObject<number | null>;
	roomRef: RefObject<IRoomViewState['room']>;
	userRef: RefObject<IRoomViewProps['user']>;
	joinCodeRef: RefObject<IJoinCode | null>;
	consumeJumpParam: (messageId: string) => void;
	navToThread: (item: any) => void;
	onQuoteInit: (messageId: string) => void;
	resetAction: () => void;
	onThreadMessagesLoaded: () => void;
	setState: (partial: Partial<TRoomViewReducerState>) => void;
}

export interface IUseRoomLifecycleResult {
	joinRoom: () => Promise<void>;
	resumeRoom: () => Promise<void>;
	onJoin: () => void;
	handleSendMessage: (message?: string, tshow?: boolean) => void;
	toggleFollowThread: (isFollowingThread: boolean, threadId?: string) => Promise<void>;
	fetchThreadName: (threadId: string, messageId: string) => Promise<string | undefined>;
}

const runInit = (roomStore: RoomStore, tmid: string | undefined, onThreadMessagesLoadedRef: RefObject<() => void>) =>
	roomStore.getState().init({ tmid, onThreadMessagesLoaded: () => onThreadMessagesLoadedRef.current?.() });

// try/catch bodies with optional chaining can't be compiled inside a 'use memo' function (compiler
// Todo), so these live at module scope; being eslint-stable also keeps effect dep arrays honest.
const safeSubscribe = (sub?: RoomClass) => {
	try {
		sub?.subscribe?.();
	} catch (e) {
		log(e);
	}
};

interface IJoinRoomContext {
	room: IRoomViewState['room'];
	isOmnichannel: boolean;
	serverVersion?: string | null;
	t?: string;
	joinCodeRef: RefObject<IJoinCode | null>;
	onJoin: () => void;
}

const joinRoomImpl = async ({ room, isOmnichannel, serverVersion, t, joinCodeRef, onJoin }: IJoinRoomContext) => {
	logEvent(events.ROOM_JOIN);
	try {
		if (isOmnichannel) {
			if ('_id' in room) {
				await takeInquiry(room._id, serverVersion as string);
			}
			onJoin();
		} else {
			const { joinCodeRequired, rid: roomRid } = room;
			if (joinCodeRequired) {
				joinCodeRef.current?.show();
			} else {
				await joinRoomService(roomRid, null, t as any);
				onJoin();
			}
		}
	} catch (e) {
		log(e);
	}
};

const resumeRoomImpl = async ({ room, isOmnichannel, onJoin }: Pick<IJoinRoomContext, 'room' | 'isOmnichannel' | 'onJoin'>) => {
	logEvent(events.ROOM_RESUME);
	try {
		if (isOmnichannel) {
			if ('rid' in room) {
				await takeResume(room.rid);
			}
			onJoin();
		}
	} catch (e) {
		log(e);
	}
};

const toggleFollowThreadImpl = async (tmid: string | undefined, isFollowingThread: boolean, threadId?: string) => {
	try {
		const threadMessageId = threadId ?? tmid;
		if (!threadMessageId) {
			return;
		}
		await toggleFollowMessage(threadMessageId, !isFollowingThread);
		EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
	} catch (e) {
		log(e);
	}
};

const handleRoomRemoved = (
	removedRid: string,
	rid: string | undefined,
	isMasterDetail: boolean,
	roomRef: RefObject<IRoomViewState['room']>
) => {
	if (removedRid === rid) {
		Navigation.popToTop(isMasterDetail);
		const currentRoom = roomRef.current;
		currentRoom.t !== 'l' &&
			showErrorAlert(I18n.t('You_were_removed_from_channel', { channel: getRoomTitle(currentRoom) }), I18n.t('Oops'));
	}
};

export function useRoomLifecycle({
	rid,
	tmid,
	t,
	isAuthenticated,
	isMasterDetail,
	isOmnichannel,
	room,
	roomUpdate,
	serverVersion,
	roomStore,
	navigation,
	route,
	dispatch,
	messageActionStore,
	sub,
	queryUnreadsRef,
	pendingJumpRef,
	jumpToThreadIdRef,
	unreadsCountRef,
	roomRef,
	userRef,
	joinCodeRef,
	consumeJumpParam,
	navToThread,
	onQuoteInit,
	resetAction,
	onThreadMessagesLoaded,
	setState
}: IUseRoomLifecycleParams): IUseRoomLifecycleResult {
	'use memo';

	// onThreadMessagesLoaded is recreated every render; a ref keeps it out of the init effects'
	// deps so they don't re-fire on identity change alone (see ticket NATIVE-1356).
	const onThreadMessagesLoadedRef = useRef(onThreadMessagesLoaded);
	useEffect(() => {
		onThreadMessagesLoadedRef.current = onThreadMessagesLoaded;
	});

	useEffect(() => {
		if (!rid || !isAuthenticated) {
			return;
		}
		const task = InteractionManager.runAfterInteractions(() => {
			runInit(roomStore, tmid, onThreadMessagesLoadedRef);
		});
		return () => task.cancel();
	}, [rid, isAuthenticated, roomStore, tmid]);

	const updateUnreadCount = async () => {
		if (!rid) {
			return;
		}
		const db = database.active;
		const observable = await db
			.get('subscriptions')
			.query(Q.where('archived', false), Q.where('open', true), Q.where('rid', Q.notEq(rid)))
			.observeWithColumns(['unread']);

		queryUnreadsRef.current = observable.subscribe(rooms => {
			const unreadsCount = rooms.reduce(
				(unreadCount, item) => (item.unread > 0 && !item.hideUnreadStatus ? unreadCount + item.unread : unreadCount),
				0
			);
			if (unreadsCountRef.current !== unreadsCount) {
				setState({ unreadsCount });
			}
		});
	};

	const handleSendMessage = (message?: string, tshow?: boolean) => {
		if (message === undefined) {
			return;
		}
		logEvent(events.ROOM_SEND_MESSAGE);
		sendMessage(rid as string, message, tmid, userRef.current, tshow).then(() => {
			roomStore.getState().markMessageSent();
			Review.pushPositiveEvent();
		});
		resetAction();
	};

	const onJoin = () => {
		roomStore.getState().join();
	};

	const joinRoom = () => joinRoomImpl({ room, isOmnichannel, serverVersion, t, joinCodeRef, onJoin });

	const resumeRoom = () => resumeRoomImpl({ room, isOmnichannel, onJoin });

	const fetchThreadName = async (threadId: string, messageId: string) => {
		const threadRecord = await getThreadById(threadId);
		if (threadRecord?.t === 'rm') {
			return I18n.t('Message_removed');
		}
		return getThreadName(rid as string, threadId, messageId);
	};

	const toggleFollowThread = (isFollowingThread: boolean, threadId?: string) =>
		toggleFollowThreadImpl(tmid, isFollowingThread, threadId);

	const mountRoom = () => {
		const { action } = messageActionStore.getState();
		const didMountInteraction = InteractionManager.runAfterInteractions(() => {
			if (rid) {
				safeSubscribe(sub);
			}
			// Main-list jump: re-anchors its own window, so fire immediately. A thread jump waits for its
			// rows and is fired from the subscription hook's success path instead.
			if (pendingJumpRef.current && !tmid) {
				consumeJumpParam(pendingJumpRef.current);
			}
			if (jumpToThreadIdRef.current && !pendingJumpRef.current) {
				navToThread({ tmid: jumpToThreadIdRef.current });
			}
			if (isIOS && rid) {
				updateUnreadCount();
			}
			if (action?.kind === 'quote' && action.messageIds.length === 1) {
				onQuoteInit(action.messageIds[0]);
			}
		});
		const unsubscribeBlur = navigation.addListener('blur', () => {
			AudioManager.pauseAudio();
		});
		return () => {
			if (didMountInteraction?.cancel) {
				didMountInteraction.cancel();
			}
			if (queryUnreadsRef.current?.unsubscribe) {
				queryUnreadsRef.current.unsubscribe();
			}
			unsubscribeBlur();
			if (sub?.unsubscribe) {
				sub.unsubscribe();
			}
			if (!tmid) {
				AudioManager.unloadRoomAudios(rid);
			}
		};
	};
	// Subscribe/cleanup run once per screen by design: dep'd versions would tear down the room
	// subscription (and unload audio) whenever `sub` or a handler identity changed mid-session.
	// The ref freezes the first-render closure so the mount effect keeps [] with no reactive reads.
	const mountRoomRef = useRef(mountRoom);
	useEffect(() => mountRoomRef.current(), []);

	useEffect(() => {
		const onRoomRemoved = ({ rid: removedRid }: { rid: string }) => handleRoomRemoved(removedRid, rid, isMasterDetail, roomRef);
		EventEmitter.addEventListener('ROOM_REMOVED', onRoomRemoved);
		return () => {
			EventEmitter.removeListener('ROOM_REMOVED', onRoomRemoved);
		};
	}, [rid, isMasterDetail, roomRef]);

	useEffect(() => {
		dispatch(clearInAppFeedback());
		return () => {
			dispatch(clearInAppFeedback());
		};
	}, [dispatch]);

	const prevJumpToMessageIdRef = useRef(route.params?.jumpToMessageId);
	useEffect(() => {
		const next = route.params?.jumpToMessageId;
		if (next && next !== prevJumpToMessageIdRef.current) {
			consumeJumpParam(next);
		}
		prevJumpToMessageIdRef.current = next;
	}, [route.params?.jumpToMessageId, consumeJumpParam]);

	const prevJumpToThreadIdRef = useRef(route.params?.jumpToThreadId);
	useEffect(() => {
		const next = route.params?.jumpToThreadId;
		if (next && next !== prevJumpToThreadIdRef.current) {
			navToThread({ tmid: next });
		}
		prevJumpToThreadIdRef.current = next;
	}, [route.params?.jumpToThreadId, navToThread]);

	// init() is skipped for invite subscriptions. Initialize when invite has been accepted
	const prevStatusRef = useRef(roomUpdate.status);
	useEffect(() => {
		if (prevStatusRef.current === 'INVITED' && roomUpdate.status !== 'INVITED') {
			runInit(roomStore, tmid, onThreadMessagesLoadedRef);
		}
		prevStatusRef.current = roomUpdate.status;
	}, [roomUpdate.status, roomStore, tmid]);

	// The published closures are rebuilt from the same module impls the returned handlers use; the
	// inline onJoin keeps the dep array to values only (a component-scope fn would warn).
	useEffect(() => {
		const onStoreJoin = () => {
			roomStore.getState().join();
		};
		roomStore.setState({
			joinRoom: () => joinRoomImpl({ room, isOmnichannel, serverVersion, t, joinCodeRef, onJoin: onStoreJoin }),
			resumeRoom: () => resumeRoomImpl({ room, isOmnichannel, onJoin: onStoreJoin })
		});
	}, [roomStore, room, isOmnichannel, serverVersion, t, joinCodeRef]);

	return {
		joinRoom,
		resumeRoom,
		onJoin,
		handleSendMessage,
		toggleFollowThread,
		fetchThreadName
	};
}
```

### 2. `app/views/RoomView/reactCompilerContract.test.ts` — replace ENTIRE file content with:

```ts
import fs from 'fs';
import path from 'path';

import { transformFileSync } from '@babel/core';

const ROOM_VIEW_DIR = path.resolve(__dirname);
const REPO_ROOT = path.resolve(__dirname, '../../..');

// Files the React Compiler silently skips today. Fixing the underlying cause must remove its file from this list.
const KNOWN_SKIPPED: string[] = [];

const collectUseMemoFiles = (dir: string): string[] => {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === '__snapshots__') continue;
			files.push(...collectUseMemoFiles(fullPath));
			continue;
		}

		if (!/\.tsx?$/.test(entry.name)) continue;
		if (entry.name.includes('.test.')) continue;

		const content = fs.readFileSync(fullPath, 'utf8');
		if (content.includes("'use memo'")) files.push(fullPath);
	}

	return files;
};

const compile = (file: string) =>
	transformFileSync(file, {
		babelrc: false,
		configFile: false,
		presets: [
			['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
			['@babel/preset-react', { runtime: 'automatic' }]
		],
		plugins: [['babel-plugin-react-compiler', { compilationMode: 'annotation', panicThreshold: 'all_errors' }]]
	});

describe('React Compiler contract for RoomView', () => {
	const absoluteFiles = collectUseMemoFiles(ROOM_VIEW_DIR);
	const relativeFiles = absoluteFiles.map(file => path.relative(REPO_ROOT, file));

	it("finds the expected set of 'use memo' files", () => {
		expect(relativeFiles.length).toBeGreaterThan(0);
	});

	const cleanFiles = relativeFiles.filter(file => !KNOWN_SKIPPED.includes(file));

	test.each(cleanFiles)('%s compiles without the compiler silently skipping it', relativeFile => {
		const absoluteFile = path.join(REPO_ROOT, relativeFile);
		expect(() => compile(absoluteFile)).not.toThrow();
	});

	// test.each throws on an empty array; the guard keeps the ratchet dormant until a file regresses.
	if (KNOWN_SKIPPED.length) {
		test.each(KNOWN_SKIPPED)('%s is still silently skipped (remove from KNOWN_SKIPPED once fixed)', relativeFile => {
			const absoluteFile = path.join(REPO_ROOT, relativeFile);
			expect(() => compile(absoluteFile)).toThrow();
		});
	}
});
```

(`KNOWN_SKIPPED` is now empty — typed `string[]` so `.includes` still typechecks — and the regression ratchet block is wrapped in `if (KNOWN_SKIPPED.length)` because `test.each` throws on an empty array.)

## Scope

- **In scope:** the two files above only.
- **Out of scope — do not touch:** `useRoomLifecycle.test.ts` (must pass UNCHANGED — it's the behavior contract; it mocks module boundaries only, so the hoists are transparent to it), any other RoomView file, `babel.config.js`, eslint config.

## Verification / done criteria

1. `TZ=UTC pnpm test --testPathPattern='reactCompilerContract'` → passes with ZERO skipped-file entries. If it fails naming `useRoomLifecycle.ts`, STOP and report the compiler error verbatim.
2. `TZ=UTC pnpm test --testPathPattern='useRoomLifecycle'` → all 23 tests pass UNCHANGED. A failure is a REAL regression — STOP and report; do not edit the test.
3. `npx eslint --resolve-plugins-relative-to . . 2>&1 | tail -3` → exactly `✖ 171 problems (0 errors, 171 warnings)` (baseline drops 174 → 171: the old file's 3 warnings die with the hoists). Any other count: STOP, report verbatim.
4. `npx tsc` → exit 0. (Plain `pnpm lint` may fail in a nested worktree — use the split commands.)
5. `TZ=UTC pnpm test` → full suite passes.
6. `git diff --stat` → exactly the 2 in-scope files.

## Test plan

Existing `useRoomLifecycle.test.ts` (23 tests: init gating, INVITED re-init, join/resume paths incl. omnichannel, send message, blur/unmount cleanup, ROOM_REMOVED alerts, jump params) is the behavior contract and must pass unmodified. The contract test with an empty `KNOWN_SKIPPED` is the compile-level proof. No new tests.

## Maintenance notes

- New room-lifecycle logic with try/catch + optional chaining belongs in a module-scope impl, not the hook body.
- The mount effect must stay `[]` with the `mountRoomRef` freeze — adding deps resubscribes the room mid-session.
- The store-publish effect's dep array must list every value its closures capture (`room`, `isOmnichannel`, `serverVersion`, `t`, `joinCodeRef`).

## Escape hatches

- Each done criterion above carries its STOP condition.
- If the current files at your checkout differ from the pre-edit state at `535cc4920`, STOP and report.
- Do not wait passively on background tasks — run all verification in the foreground.
