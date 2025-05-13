import { Q } from '@nozbe/watermelondb';

import { IServerSubscription, IServerRoom } from '../../../definitions';
import database from '../../database';

export default async (subscriptions: IServerSubscription[], rooms: IServerRoom[]) => {
	let sub = subscriptions;
	try {
		const db = database.active;
		const subCollection = db.get('subscriptions');

		const roomIds = rooms.filter(r => !subscriptions.find(s => s.rid === r._id)).map(r => r._id);
		const existingSubs = await subCollection.query(Q.where('rid', Q.oneOf(roomIds))).fetch();
		const mappedExistingSubs = existingSubs.map(s => s.asPlain());
		// Assign
		sub = subscriptions.concat(mappedExistingSubs as unknown as IServerSubscription);
	} catch {
		// do nothing
	}

	return sub;
};
