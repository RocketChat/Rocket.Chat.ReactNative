import { useEffect, useRef } from 'react';

import log from '../../../lib/methods/helpers/log';
import { ISubscription, TSubscriptionModel } from '../../../definitions';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';

interface IUserRoomSubscription {
	rid: string;
	initializeRoomState: (room: ISubscription) => void;
}

const useRoomSubscription = ({ rid, initializeRoomState }: IUserRoomSubscription) => {
	const room = useRef<TSubscriptionModel>({} as TSubscriptionModel);

	const loadRoom = async () => {
		if (!rid) {
			return;
		}
		try {
			const sub = await getSubscriptionByRoomId(rid);
			if (!sub) {
				return;
			}
			room.current = sub;
			initializeRoomState(room.current);
		} catch (e) {
			log(e);
		}
	};

	useEffect(() => {
		loadRoom();
	}, []);

	return {
		room: room.current
	};
};

export default useRoomSubscription;
