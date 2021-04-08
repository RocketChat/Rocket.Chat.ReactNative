import database from '../../../lib/database';

const getRoleDescription = async(id) => {
	const db = database.active;
	try {
		const rolesCollection = db.get('roles');
		const role = await rolesCollection.find(id);
		if (role) {
			return role.description;
		}
		return null;
	} catch (e) {
		return null;
	}
};

export default getRoleDescription;
