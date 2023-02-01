import { Clause } from '@nozbe/watermelondb/QueryDescription';

import database from '..';
import { TAppDatabase } from '../interfaces';
import { MESSAGES_TABLE } from '../model/Message';

const getCollection = (db: TAppDatabase) => db.get(MESSAGES_TABLE);

export const getMessageById = async (messageId: string | null) => {
	if (!messageId) {
		return null;
	}
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		const result = await messageCollection.find(messageId);
		return result;
	} catch (error) {
		return null;
	}
};

export const getMessageByQuery = async (...query: Clause[]) => {
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		const result = await messageCollection.query(...query).fetch();
		return result;
	} catch (error) {
		return null;
	}
};
