import database from '..';
import { type TAppDatabase } from '../interfaces';
import { UPLOADS_TABLE } from '../model';

const getCollection = (db: TAppDatabase) => db.get(UPLOADS_TABLE);

export const getUploadByPath = async (path: string) => {
	const db = database.active;
	const uploadCollection = getCollection(db);
	try {
		const result = await uploadCollection.find(path);
		return result;
	} catch (error) {
		return null;
	}
};
