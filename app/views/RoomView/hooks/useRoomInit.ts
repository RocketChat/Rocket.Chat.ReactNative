import { type RefObject, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';

import { type TMessageActionStore } from '../../../containers/message/stores/MessageActionStore';
import { type IRoomViewState } from '../definitions';
import { type RoomStore } from '../stores/RoomStore';

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

export function useRoomInit({
	rid,
	tmid,
	isAuthenticated,
	roomStore,
	roomUpdate,
	onThreadMessagesLoaded,
	messageActionStore,
	onQuoteInit
}: IUseRoomInitParams): void {
	'use memo';

	// onThreadMessagesLoaded is recreated every render; a ref keeps it out of the init effects'
	// deps so they don't re-fire on identity change alone (see ticket NATIVE-1356).
	const onLoadedRef = useRef(onThreadMessagesLoaded);
	useEffect(() => {
		onLoadedRef.current = onThreadMessagesLoaded;
	});

	const onQuoteInitRef = useRef(onQuoteInit);
	useEffect(() => {
		onQuoteInitRef.current = onQuoteInit;
	});

	useEffect(() => {
		if (!rid || !isAuthenticated) {
			return;
		}
		const task = InteractionManager.runAfterInteractions(() => runInit(roomStore, tmid, onLoadedRef));
		return () => task.cancel();
	}, [rid, isAuthenticated, roomStore, tmid]);

	// messageActionStore is useState-stable, so this fires once per screen.
	useEffect(() => {
		const task = InteractionManager.runAfterInteractions(() => {
			const { action } = messageActionStore.getState();
			if (action?.kind === 'quote' && action.messageIds.length === 1) {
				onQuoteInitRef.current(action.messageIds[0]);
			}
		});
		return () => task.cancel();
	}, [messageActionStore]);

	// init() is skipped for invite subscriptions. Initialize when invite has been accepted
	const prevStatusRef = useRef(roomUpdate.status);
	useEffect(() => {
		if (prevStatusRef.current === 'INVITED' && roomUpdate.status !== 'INVITED') {
			runInit(roomStore, tmid, onLoadedRef);
		}
		prevStatusRef.current = roomUpdate.status;
	}, [roomUpdate.status, roomStore, tmid]);
}
