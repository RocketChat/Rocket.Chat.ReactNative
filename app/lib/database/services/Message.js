import database from '..';
import { TABLE_NAME } from '../model/Message';

const getCollection = db => db.get(TABLE_NAME);

export const getMessageById = (messageId) => {
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		return messageCollection.find(messageId);
	} catch (error) {
		return null;
	}
};
