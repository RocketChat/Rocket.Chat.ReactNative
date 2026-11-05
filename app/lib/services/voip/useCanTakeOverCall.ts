import type { CallContact } from '@rocket.chat/media-signaling';
import { useCallback, useSyncExternalStore } from 'react';

import { mediaSessionStore } from './MediaSessionStore';

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
		// A user dialed by SIP extension arrives as a `sip` contact; the server still sends their user id as `uid`.
		const contact: (CallContact & { uid?: string }) | undefined = instance.getState()?.call.remoteParticipants[0]?.contact;
		const contactUserId = contact?.type === 'user' ? contact.id : contact?.uid;
		return contactUserId === peerUserId;
	}, [peerUserId]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

const getCanTakeOverAnyCall = () => Boolean(mediaSessionStore.getCurrentInstance()?.canTakeOverCall());

/** True while another session of this user carries a call, with anyone, that this device can take over. */
export const useCanTakeOverAnyCall = (): boolean => useSyncExternalStore(subscribe, getCanTakeOverAnyCall);
