import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from '../../utils/log';
import protectedFunction from './helpers/protectedFunction';

export default function() {
	const db = database.active;
	return new Promise(async(resolve) => {
		try {
			// RC 0.70.0
			const result = await this.sdk.get('roles.list');

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
