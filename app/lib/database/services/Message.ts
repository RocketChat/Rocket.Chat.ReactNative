import database from '..';
import { type TAppDatabase } from '../interfaces';
import { MESSAGES_TABLE } from '../model/Message';
import { getThreadMessageById } from './ThreadMessage';

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

export const getMessageOrThreadMessageById = async (messageId: string | null) => {
	if (!messageId) {
		return null;
	}
	return (await getMessageById(messageId)) ?? getThreadMessageById(messageId);
};
