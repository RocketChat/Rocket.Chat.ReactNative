import database from '..';
import { TABLE_NAME } from '../model/ThreadMessage';

const getCollection = db => db.get(TABLE_NAME);

export const getThreadMessageById = async(messageId) => {
	const db = database.active;
	const threadMessageCollection = getCollection(db);
	try {
		const result = await threadMessageCollection.find(messageId);
		return result;
	} catch (error) {
		return null;
	}
};
