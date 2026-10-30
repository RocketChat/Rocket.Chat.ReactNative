import { useEffect, useState } from 'react';

import log from '~/lib/methods/helpers/log';
import RoomClass from '~/lib/methods/subscriptions/room';

const safeSubscribe = (sub: RoomClass) => {
	try {
		sub.subscribe?.();
	} catch (e) {
		log(e);
	}
};

export function useRoomSubscription(rid: string | undefined, tmid: string | undefined): void {
	const [sub] = useState(() => (rid && !tmid ? new RoomClass(rid) : undefined));

	useEffect(() => {
		if (!sub) {
			return;
		}
		const immediate = setImmediate(() => safeSubscribe(sub));
		return () => {
			clearImmediate(immediate);
			sub.unsubscribe?.();
		};
	}, [sub]);
}
