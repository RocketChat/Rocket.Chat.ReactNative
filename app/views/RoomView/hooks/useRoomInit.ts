import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

import { useLiveRef } from '../../../lib/hooks/useLiveRef';
import log from '../../../lib/methods/helpers/log';
import { type TMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import { type IRoomViewState, type IUseRoomInitResult, type RoomStore } from '../definitions';

interface IUseRoomInitParams {
	rid?: string;
	tmid?: string;
	isAuthenticated: boolean;
	roomStore: RoomStore;
	roomUpdate: IRoomViewState['roomUpdate'];
	onThreadMessagesLoaded: () => void;
	messageActionStore: TMessageActionStore;
	onQuoteInit: (messageId: string) => void;
}

// Raises the screen's loading flag for the duration of one init() run. init() resolves on the invite
// early-return and on failure alike, so the finally is the only place that clears it; awaiting it is
// what keeps the footer from flickering. Lives outside the hook because the React Compiler cannot
// lower a try/finally inside a hook body (see reactCompilerContract.test.ts).
//
// `controller` belongs to this run alone and is never reset by a later one: once a newer run aborts
// it, this run stops writing for a screen that has already moved on.
const runInitWithLoading = async (
	roomStore: RoomStore,
	tmid: string | undefined,
	onLoadedRef: RefObject<() => void>,
	controller: AbortController,
	setLoading: (loading: boolean) => void,
	setLastSeen: (lastSeen: IRoomViewState['lastSeen']) => void
): Promise<void> => {
	setLoading(true);
	try {
		const result = await roomStore.getState().init({
			tmid,
			onThreadMessagesLoaded: () => onLoadedRef.current?.(),
			signal: controller.signal
		});
		// Only a loaded run carries an anchor; `failed` and `skipped` leave the current one alone.
		if (!controller.signal.aborted && result.status === 'loaded') {
			setLastSeen(result.lastSeen);
		}
	} catch (e) {
		log(e);
	} finally {
		if (!controller.signal.aborted) {
			setLoading(false);
		}
	}
};

export function useRoomInit({
	rid,
	tmid,
	isAuthenticated,
	roomStore,
	roomUpdate,
	onThreadMessagesLoaded,
	messageActionStore,
	onQuoteInit
}: IUseRoomInitParams): IUseRoomInitResult {
	// onThreadMessagesLoaded is recreated every render; a live ref keeps it out of the init effects'
	// deps so they don't re-fire on identity change alone (see ticket NATIVE-1356).
	const onLoadedRef = useLiveRef(onThreadMessagesLoaded);
	const onQuoteInitRef = useLiveRef(onQuoteInit);

	// `loading` is per-screen: room and thread mount two RoomViews on one rid-keyed store, so it lives
	// here instead of the store. The ref guards every write against a screen that already went away.
	const [loading, setLoading] = useState(true);
	// `lastSeen` (the unread divider anchor) is per-screen for the same reason: a send from the thread
	// screen clears its own anchor and leaves the room screen's divider where it was.
	const [lastSeen, setLastSeen] = useState<IRoomViewState['lastSeen']>(null);
	// One controller per init() run. A new run aborts the one it supersedes and never resets it, so a
	// still-in-flight predecessor can no longer un-cancel itself and write for a screen that moved on.
	const initControllerRef = useRef<AbortController | null>(null);

	const initWithLoading = useCallback(() => {
		initControllerRef.current?.abort();
		const controller = new AbortController();
		initControllerRef.current = controller;
		return runInitWithLoading(roomStore, tmid, onLoadedRef, controller, setLoading, setLastSeen);
	}, [roomStore, tmid, onLoadedRef]);

	const clearLastSeen = useCallback(() => setLastSeen(null), []);

	useEffect(() => {
		if (!rid || !isAuthenticated) {
			return;
		}
		const task = InteractionManager.runAfterInteractions(() => initWithLoading());
		return () => {
			initControllerRef.current?.abort();
			task.cancel();
		};
	}, [rid, isAuthenticated, initWithLoading]);

	// messageActionStore is useState-stable, so this fires once per screen.
	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			const { action } = messageActionStore.getState();
			if (action?.kind === 'quote' && action.messageIds.length === 1) {
				onQuoteInitRef.current(action.messageIds[0]);
			}
		});
		return () => task.cancel();
	}, [messageActionStore, onQuoteInitRef]);

	// init() is skipped for invite subscriptions. Initialize when invite has been accepted
	const prevStatusRef = useRef(roomUpdate.status);
	useEffect(() => {
		if (prevStatusRef.current === 'INVITED' && roomUpdate.status !== 'INVITED') {
			initWithLoading();
		}
		prevStatusRef.current = roomUpdate.status;
	}, [roomUpdate.status, initWithLoading]);

	return { loading, lastSeen, clearLastSeen };
}
