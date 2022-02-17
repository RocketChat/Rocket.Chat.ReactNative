import database from '..';
import { MESSAGES_TABLE } from '../model/Message';
import { TAppDatabase } from '../interfaces';

const getCollection = (db: TAppDatabase) => db.get(MESSAGES_TABLE);

export const getMessageById = async (messageId: string) => {
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		const result = await messageCollection.find(messageId);
		return result;
	} catch (error) {
		return null;
	}
};
