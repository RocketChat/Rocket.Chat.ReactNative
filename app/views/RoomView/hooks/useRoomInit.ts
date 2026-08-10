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

const runInit = (roomStore: RoomStore, tmid: string | undefined, onLoadedRef: RefObject<() => void>) =>
	roomStore.getState().init({ tmid, onThreadMessagesLoaded: () => onLoadedRef.current?.() });

// Raises the screen's loading flag for the duration of one init() run. init() resolves on the invite
// early-return and on failure alike, so the finally is the only place that clears it; awaiting it is
// what keeps the footer from flickering. The ref guards the writes against a screen that went away.
const runInitWithLoading = async (
	roomStore: RoomStore,
	tmid: string | undefined,
	onLoadedRef: RefObject<() => void>,
	cancelledRef: RefObject<boolean>,
	setLoading: (loading: boolean) => void,
	setLastSeen: (lastSeen: IRoomViewState['lastSeen']) => void
): Promise<void> => {
	cancelledRef.current = false;
	setLoading(true);
	try {
		const nextLastSeen = await runInit(roomStore, tmid, onLoadedRef);
		if (!cancelledRef.current) {
			setLastSeen(nextLastSeen);
		}
	} catch (e) {
		log(e);
	} finally {
		if (!cancelledRef.current) {
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
	const cancelledRef = useRef(false);

	const initWithLoading = useCallback(
		() => runInitWithLoading(roomStore, tmid, onLoadedRef, cancelledRef, setLoading, setLastSeen),
		[roomStore, tmid, onLoadedRef]
	);

	const clearLastSeen = useCallback(() => setLastSeen(null), []);

	useEffect(() => {
		if (!rid || !isAuthenticated) {
			return;
		}
		const task = InteractionManager.runAfterInteractions(() => initWithLoading());
		return () => {
			cancelledRef.current = true;
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
