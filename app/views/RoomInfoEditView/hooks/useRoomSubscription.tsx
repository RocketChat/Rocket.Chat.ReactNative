import { useEffect, useRef } from 'react';
import { Subscription } from 'rxjs';

import log from '../../../lib/methods/helpers/log';
import { ISubscription } from '../../../definitions';
import database from '../../../lib/database';

interface IUserRoomSubscription {
	rid: string;
	initializeRoomState: (room: ISubscription) => void;
}

const useRoomSubscription = ({ rid, initializeRoomState }: IUserRoomSubscription) => {
	const room = useRef<ISubscription>({} as ISubscription);
	const querySubscription = useRef<Subscription>(null);

	const loadRoom = async () => {
		if (!rid) {
			return;
		}
		try {
			const db = database.active;
			const sub = await db.get('subscriptions').find(rid);
			const observable = sub.observe();

			querySubscription.current = observable.subscribe(data => {
				room.current = data;
				initializeRoomState(room.current);
			});
		} catch (e) {
			log(e);
		}
	};

	useEffect(() => {
		loadRoom();

		return () => {
			querySubscription.current?.unsubscribe();
		};
	}, []);

	return {
		room: room.current
	};
};

export default useRoomSubscription;
