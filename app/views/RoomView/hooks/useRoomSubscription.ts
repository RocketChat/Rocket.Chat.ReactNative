import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

import log from '../../../lib/methods/helpers/log';
import type RoomClass from '../../../lib/methods/subscriptions/room';

const safeSubscribe = (sub?: RoomClass) => {
	try {
		sub?.subscribe?.();
	} catch (e) {
		log(e);
	}
};

export function useRoomSubscription(sub?: RoomClass): void {
	useEffect(() => {
		if (!sub) {
			return;
		}
		const task = InteractionManager.runAfterInteractions(() => safeSubscribe(sub));
		return () => {
			task.cancel();
			sub.unsubscribe?.();
		};
	}, [sub]);
}
