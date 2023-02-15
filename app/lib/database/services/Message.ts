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
	} catch {
		return null;
	}
};
