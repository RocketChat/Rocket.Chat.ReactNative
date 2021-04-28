import database from '..';
import { TABLE_NAME } from '../model/Message';

const getCollection = db => db.get(TABLE_NAME);

export const getMessageById = async(messageId) => {
	const db = database.active;
	const messageCollection = getCollection(db);
	try {
		const result = await messageCollection.find(messageId);
		return result;
	} catch (error) {
		return null;
	}
};
