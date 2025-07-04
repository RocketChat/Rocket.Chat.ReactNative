import { useEffect, useRef } from 'react';

import log from '../../../lib/methods/helpers/log';
import { ISubscription } from '../../../definitions';
import database from '../../../lib/database';

interface IUserRoomSubscription {
	rid: string;
	initializeRoomState: (room: ISubscription) => void;
}

const useRoomSubscription = ({ rid, initializeRoomState }: IUserRoomSubscription) => {
	const room = useRef<ISubscription>({} as ISubscription);

	const loadRoom = async () => {
		if (!rid) {
			return;
		}
		try {
			const db = database.active;
			const sub = await db.get('subscriptions').find(rid);
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
