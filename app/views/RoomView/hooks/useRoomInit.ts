import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import log from '../../../lib/methods/helpers/log';
import { type IRoomScreenContextValue, type IRoomViewState, type RoomStore } from '../definitions';

interface IUseRoomInitParams {
	rid?: string;
	tmid?: string;
	isAuthenticated: boolean;
	ready: boolean;
	roomStore: RoomStore;
	onThreadMessagesLoaded: () => void;
}

interface IRunInitSetters {
	setSettled: (settled: boolean) => void;
	setLastSeen: (lastSeen: IRoomViewState['lastSeen']) => void;
	setFailed: (failed: boolean) => void;
}

// Marks the screen unsettled for the duration of one init() run. init() resolves on the invite
// early-return and on failure alike, so the finally is the only place that settles it; awaiting it is
// what keeps the footer from flickering. Lives outside the hook because the React Compiler cannot
// lower a try/finally inside a hook body (see reactCompilerContract.test.ts).
//
// `controller` belongs to this run alone and is never reset by a later one: once a newer run aborts
// it, this run stops writing for a screen that has already moved on.
const runInit = async (
	roomStore: RoomStore,
	tmid: string | undefined,
	onLoadedRef: RefObject<() => void>,
	controller: AbortController,
	{ setSettled, setLastSeen, setFailed }: IRunInitSetters
): Promise<void> => {
	setSettled(false);
	try {
		const result = await roomStore.getState().init({
			tmid,
			onThreadMessagesLoaded: () => onLoadedRef.current?.(),
			signal: controller.signal
		});
		if (!controller.signal.aborted) {
			if (result.status === 'loaded') {
				setLastSeen(result.lastSeen);
			}
			setFailed(result.status === 'failed');
		}
	} catch (e) {
		log(e);
		if (!controller.signal.aborted) {
			setFailed(true);
		}
	} finally {
		if (!controller.signal.aborted) {
			setSettled(true);
		}
	}
};

export function useRoomInit({
	rid,
	tmid,
	isAuthenticated,
	ready,
	roomStore,
	onThreadMessagesLoaded
}: IUseRoomInitParams): IRoomScreenContextValue {
	// onThreadMessagesLoaded is recreated every render; a live ref keeps it out of the init effects'
	// deps so they don't re-fire on identity change alone (see ticket NATIVE-1356).
	const onLoadedRef = useLiveRef(onThreadMessagesLoaded);

	// The unread divider anchor belongs to this screen, not to the room — see stores/RoomScreenContext.
	const [lastSeen, setLastSeen] = useState<IRoomViewState['lastSeen']>(null);
	// `settled` tracks the init run, and only the init run. A screen that has no rid or no auth never
	// starts one, so `loading` is derived from both: no work pending means idle, never a stuck flag.
	const [settled, setSettled] = useState(false);
	const [failed, setFailed] = useState(false);
	const hasInitWork = !!rid && isAuthenticated && ready;
	const loading = hasInitWork && !settled;
	// One controller per init() run. A new run aborts the one it supersedes and never resets it, so a
	// still-in-flight predecessor can no longer un-cancel itself and write for a screen that moved on.
	const initControllerRef = useRef<AbortController | null>(null);

	const init = useCallback(() => {
		initControllerRef.current?.abort();
		const controller = new AbortController();
		initControllerRef.current = controller;
		setFailed(false);
		return runInit(roomStore, tmid, onLoadedRef, controller, { setSettled, setLastSeen, setFailed });
	}, [roomStore, tmid, onLoadedRef]);

	const clearLastSeen = useCallback(() => setLastSeen(null), []);

	useEffect(() => {
		if (!hasInitWork) {
			return;
		}
		// Settle down synchronously, before the deferred run starts: a rid swap commits its render
		// before this effect, so leaving the previous run's `settled` in place would show an enabled
		// footer for one frame on a room that has not loaded yet.
		setSettled(false);
		const task = InteractionManager.runAfterInteractions(() => init());
		return () => {
			initControllerRef.current?.abort();
			task.cancel();
		};
		// rid and isAuthenticated stay in the deps: hasInitWork alone would not re-fire on a rid swap.
	}, [rid, isAuthenticated, ready, hasInitWork, init]);

	return { loading, failed: hasInitWork && failed && !loading, retry: init, lastSeen, clearLastSeen };
}
