import database from '..';
import { type TAppDatabase } from '../interfaces';
import { MESSAGES_TABLE } from '../model/Message';
import { getThreadById } from './Thread';
import { getThreadMessageById } from './ThreadMessage';

const getCollection = (db: TAppDatabase) => db.get(MESSAGES_TABLE);

const findInMessages = async (messageId: string) => {
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		const result = await messageCollection.find(messageId);
		return result;
	} catch {
		return null;
	}
};

export const getMessageById = async (messageId: string | null, tmid?: string | null) => {
	if (!messageId) {
		return null;
	}

	if (!tmid) {
		return findInMessages(messageId);
	}

	return (await getThreadMessageById(messageId)) ?? (await findInMessages(messageId)) ?? getThreadById(messageId);
};

export const getMessageOrThreadMessageById = async (messageId: string) =>
	(await findInMessages(messageId)) ?? getThreadMessageById(messageId);
