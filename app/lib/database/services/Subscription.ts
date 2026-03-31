import { Q } from '@nozbe/watermelondb';

import database from '..';
import { type TSubscriptionModel } from '../../../definitions';
import { type TAppDatabase } from '../interfaces';
import { SUBSCRIPTIONS_TABLE } from '../model/Subscription';

const getCollection = (db: TAppDatabase) => db.get(SUBSCRIPTIONS_TABLE);

export const getDMSubscriptionByUsername = async (username: string): Promise<TSubscriptionModel | null> => {
	if (!username) {
		return null;
	}
	const db = database.active;
	const subCollection = getCollection(db);
	const rows = await subCollection.query(Q.where('name', username), Q.where('t', 'd'), Q.take(1)).fetch();
	return rows[0] ?? null;
};

export const getSubscriptionByRoomId = async (rid: string): Promise<TSubscriptionModel | null> => {
	const db = database.active;
	const subCollection = getCollection(db);
	try {
		const result = await subCollection.find(rid);
		return result;
	} catch (error) {
		return null;
	}
};
