import database from '..';
import { THREAD_MESSAGES_TABLE } from '../model/ThreadMessage';

const getCollection = db => db.get(THREAD_MESSAGES_TABLE);

export const getThreadMessageById = async messageId => {
	const db = database.active;
	const threadMessageCollection = getCollection(db);
	try {
		const result = await threadMessageCollection.find(messageId);
		return result;
	} catch (error) {
		return null;
	}
};
