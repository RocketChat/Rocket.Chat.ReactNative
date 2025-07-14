import { useEffect, useState } from 'react';

import log from '../../../lib/methods/helpers/log';
import { ISubscription } from '../../../definitions';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';

interface IUserRoomSubscription {
	rid: string;
	initializeRoomState: (room: ISubscription) => void;
}

const useRoomSubscription = ({ rid, initializeRoomState }: IUserRoomSubscription) => {
	const [room, setRoom] = useState<ISubscription>({} as ISubscription);

	useEffect(() => {
		const loadRoom = async () => {
			if (!rid) return;
			try {
				const sub = await getSubscriptionByRoomId(rid);
				if (!sub) {
					return;
				}
				initializeRoomState(sub);
				setRoom(sub);
			} catch (e) {
				log(e);
			}
		};

		loadRoom();
	}, [rid]);

	return {
		room
	};
};

export default useRoomSubscription;
