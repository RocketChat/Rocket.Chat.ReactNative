import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

import log from '../../../lib/methods/helpers/log';
import type RoomClass from '../../../lib/methods/subscriptions/room';

// try/catch bodies with optional chaining can't be compiled inside a 'use memo' function (compiler
// Todo), so these live at module scope; being eslint-stable also keeps effect dep arrays honest.
const safeSubscribe = (sub?: RoomClass) => {
	try {
		sub?.subscribe?.();
	} catch (e) {
		log(e);
	}
};

export function useRoomSubscription(sub?: RoomClass): void {
	'use memo';

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
