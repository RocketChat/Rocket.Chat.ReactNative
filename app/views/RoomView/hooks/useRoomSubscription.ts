import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

import log from '../../../lib/methods/helpers/log';
import RoomClass from '../../../lib/methods/subscriptions/room';

const safeSubscribe = (sub: RoomClass) => {
	try {
		sub.subscribe?.();
	} catch (e) {
		log(e);
	}
};

// A thread screen shares its parent's subscription, so only the parent screen (no tmid) opens one.
export function useRoomSubscription(rid: string | undefined, tmid: string | undefined): void {
	const [sub] = useState(() => (rid && !tmid ? new RoomClass(rid) : undefined));

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
