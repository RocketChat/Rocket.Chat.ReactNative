import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from '../../utils/log';
import reduxStore from '../createStore';
import protectedFunction from './helpers/protectedFunction';
import { setRoles as setRolessAction } from '../../actions/roles';

export async function setRoles() {
	const db = database.active;
	const rolesCollection = db.collections.get('roles');
	const allRoles = await rolesCollection.query().fetch();
	const parsed = allRoles.reduce((acc, item) => ({ ...acc, [item.id]: item.description }), {});

	reduxStore.dispatch(setRolessAction(parsed));
}

export function getRoles() {
	const db = database.active;
	return new Promise(async(resolve) => {
		try {
			// RC 0.70.0
			const result = await this.sdk.get('roles.list');
			this.sdk.subscribe('stream-notify-logged', 'roles-change');

			if (!result.success) {
				return resolve();
			}

			const { roles } = result;

			if (roles && roles.length) {
				await db.action(async() => {
					const rolesCollections = db.get('roles');
					const allRolesRecords = await rolesCollections.query().fetch();

					// filter roles
					let rolesToCreate = roles.filter(i1 => !allRolesRecords.find(i2 => i1._id === i2.id));
					let rolesToUpdate = allRolesRecords.filter(i1 => roles.find(i2 => i1.id === i2._id));

					// Create
					rolesToCreate = rolesToCreate.map(role => rolesCollections.prepareCreate(protectedFunction((r) => {
						r._raw = sanitizedRaw({ id: role._id }, rolesCollections.schema);
						Object.assign(r, role);
					})));

					// Update
					rolesToUpdate = rolesToUpdate.map((role) => {
						const newRole = roles.find(r => r._id === role.id);
						return role.prepareUpdate(protectedFunction((r) => {
							Object.assign(r, newRole);
						}));
					});

					const allRecords = [
						...rolesToCreate,
						...rolesToUpdate
					];

					try {
						await db.batch(...allRecords);
					} catch (e) {
						log(e);
					}
					setRoles();
					return allRecords.length;
				});
				return resolve();
			}
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
