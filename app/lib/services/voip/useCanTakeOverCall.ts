import { useSyncExternalStore } from 'react';

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

const getSnapshot = () => mediaSessionStore.getCurrentInstance()?.canTakeOverCall() ?? false;

/** True while another session of this user carries a call that this device can take over. */
export const useCanTakeOverCall = (): boolean => useSyncExternalStore(subscribe, getSnapshot);
