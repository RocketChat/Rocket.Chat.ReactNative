import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';

import { useLiveRef } from '~/lib/hooks/useLiveRef';
import log from '~/lib/methods/helpers/log';
import { type IRoomScreenContextValue, type RoomStore } from '../definitions';

interface IUseRoomInitParams {
	rid?: string;
	tmid?: string;
	isAuthenticated: boolean;
	ready: boolean;
	roomStore: RoomStore;
	onThreadMessagesLoaded: () => void;
}

interface IRunInitSetters {
	settle: () => void;
	setLastSeen: (lastSeen: Date | null) => void;
}

const runInit = async (
	roomStore: RoomStore,
	tmid: string | undefined,
	onLoadedRef: RefObject<() => void>,
	controller: AbortController,
	{ settle, setLastSeen }: IRunInitSetters
): Promise<void> => {
	try {
		const result = await roomStore.getState().init({
			tmid,
			onThreadMessagesLoaded: () => onLoadedRef.current?.(),
			signal: controller.signal
		});
		if (!controller.signal.aborted && result.status === 'loaded') {
			setLastSeen(result.lastSeen);
		}
	} catch (e) {
		log(e);
	} finally {
		if (!controller.signal.aborted) {
			settle();
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
	const [lastSeen, setLastSeen] = useState<Date | null>(null);
	const hasInitWork = !!rid && isAuthenticated && ready;
	const initTarget = hasInitWork ? `${rid}:${tmid}` : null;
	const [settledTarget, setSettledTarget] = useState<string | null>(null);
	const loading = initTarget !== null && settledTarget !== initTarget;
	// One controller per init() run. A new run aborts the one it supersedes and never resets it, so a
	// still-in-flight predecessor can no longer un-cancel itself and write for a screen that moved on.
	const initControllerRef = useRef<AbortController | null>(null);

	const clearLastSeen = useCallback(() => setLastSeen(null), []);

	useEffect(() => {
		if (initTarget === null) {
			return;
		}
		const task = InteractionManager.runAfterInteractions(() => {
			initControllerRef.current?.abort();
			const controller = new AbortController();
			initControllerRef.current = controller;
			return runInit(roomStore, tmid, onLoadedRef, controller, {
				settle: () => setSettledTarget(initTarget),
				setLastSeen
			});
		});
		return () => {
			initControllerRef.current?.abort();
			setSettledTarget(null);
			task.cancel();
		};
	}, [initTarget, roomStore, tmid, onLoadedRef]);

	return { loading, lastSeen, clearLastSeen };
}
