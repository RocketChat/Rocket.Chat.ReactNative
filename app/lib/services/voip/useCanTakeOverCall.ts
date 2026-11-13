import { useCallback, useSyncExternalStore } from 'react';

import { mediaSessionStore } from './MediaSessionStore';
import { getContactUserId } from './getContactUserId';

const subscribe = (onChange: () => void) => {
	let unsubscribeInstance: (() => void) | undefined;
	const bindInstance = () => {
		unsubscribeInstance?.();
		unsubscribeInstance = mediaSessionStore.getCurrentInstance()?.on('sessionStateChange', onChange);
		onChange();
	};
	bindInstance();
	const unsubscribeStore = mediaSessionStore.onChange(bindInstance);
	return () => {
		unsubscribeStore();
		unsubscribeInstance?.();
	};
};

/** True while another session of this user carries a call with `peerUserId` that this device can take over. */
export const useCanTakeOverCall = (peerUserId: string | null | undefined): boolean => {
	const getSnapshot = useCallback(() => {
		const instance = mediaSessionStore.getCurrentInstance();
		if (!peerUserId || !instance?.canTakeOverCall()) {
			return false;
		}
		return getContactUserId(instance.getState()?.call.remoteParticipants[0]?.contact) === peerUserId;
	}, [peerUserId]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

const getCanTakeOverAnyCall = () => Boolean(mediaSessionStore.getCurrentInstance()?.canTakeOverCall());

/** True while another session of this user carries a call, with anyone, that this device can take over. */
export const useCanTakeOverAnyCall = (): boolean => useSyncExternalStore(subscribe, getCanTakeOverAnyCall);
