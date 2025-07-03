import { useEffect, useRef } from 'react';
import { Subscription } from 'rxjs';

import log from '../../../lib/methods/helpers/log';
import { ISubscription } from '../../../definitions';
import database from '../../../lib/database';
import { hasPermission } from '../../../lib/methods/helpers';
import { TSupportedPermissions } from '../../../reducers/permissions';

interface IUserRoomSubscription {
	rid: string;
	setReadOnlyPermission: string[];
	setReactWhenReadOnlyPermission: string[];
	archiveRoomPermission: string[];
	unarchiveRoomPermission: string[];
	deleteCPermission: string[];
	deletePPermission: string[];
	deleteTeamPermission: string[];
	setPermissions: (permissions: { [key in TSupportedPermissions]?: boolean }) => void;
	initializeRoomState: (room: ISubscription) => void;
}

const useRoomSubscription = ({
	rid,
	archiveRoomPermission,
	deleteCPermission,
	deletePPermission,
	deleteTeamPermission,
	setReactWhenReadOnlyPermission,
	setReadOnlyPermission,
	unarchiveRoomPermission,
	setPermissions,
	initializeRoomState
}: IUserRoomSubscription) => {
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

			const result = await hasPermission(
				[
					setReadOnlyPermission,
					setReactWhenReadOnlyPermission,
					archiveRoomPermission,
					unarchiveRoomPermission,
					deleteCPermission,
					deletePPermission,
					...(room.current?.teamMain ? [deleteTeamPermission] : [])
				],
				rid
			);
			setPermissions({
				'set-readonly': result[0],
				'set-react-when-readonly': result[1],
				'archive-room': result[2],
				'unarchive-room': result[3],
				'delete-c': result[4],
				'delete-p': result[5],
				...(room.current?.teamMain && { 'delete-team': result[6] })
			});
		} catch (e) {
			log(e);
		}
	};

	useEffect(() => {
		loadRoom();

		return () => {
			room.current?.unsubscribe();
			querySubscription.current?.unsubscribe();
		};
	}, []);

	return {
		room: room.current
	};
};

export default useRoomSubscription;
