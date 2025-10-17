import database from '..';
import { type TAppDatabase } from '../interfaces';
import { ROLES_TABLE } from '../model';
import { type TRoleModel } from '../../../definitions';

const getCollection = (db: TAppDatabase) => db.get(ROLES_TABLE);

export const getRoleById = async (id: string): Promise<TRoleModel | null> => {
	const db = database.active;
	const roleCollection = getCollection(db);
	try {
		const result = await roleCollection.find(id);
		return result;
	} catch (error) {
		return null;
	}
};
