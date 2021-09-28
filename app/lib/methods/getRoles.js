import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../database';
import log from '../../utils/log';
import reduxStore from '../createStore';
import { removeRoles, setRoles as setRolesAction, updateRoles } from '../../actions/roles';
import protectedFunction from './helpers/protectedFunction';

export async function setRoles() {
	const db = database.active;
	const rolesCollection = db.collections.get('roles');
	const allRoles = await rolesCollection.query().fetch();
	const parsed = allRoles.reduce((acc, item) => ({ ...acc, [item.id]: item.description || item.id }), {});
	reduxStore.dispatch(setRolesAction(parsed));
}

export async function onRolesChanged(ddpMessage) {
	const { type, _id, description } = ddpMessage.fields.args[0];
	if (/changed/.test(type)) {
		const db = database.active;
		const rolesCollection = db.get('roles');
		try {
			const rolesRecord = await rolesCollection.find(_id);
			try {
				await db.action(async () => {
					await rolesRecord.update(u => {
						u.description = description;
					});
				});
			} catch (e) {
				log(e);
			}
			reduxStore.dispatch(updateRoles(_id, description));
		} catch (err) {
			try {
				await db.action(async () => {
					await rolesCollection.create(post => {
						post._raw = sanitizedRaw({ id: _id, description }, rolesCollection.schema);
					});
				});
			} catch (e) {
				log(e);
			}
			reduxStore.dispatch(updateRoles(_id, description || _id));
		}
	}
	if (/removed/.test(type)) {
		const db = database.active;
		const rolesCollection = db.get('roles');
		try {
			const rolesRecord = await rolesCollection.find(_id);
			await db.action(async () => {
				await rolesRecord.destroyPermanently();
			});
			reduxStore.dispatch(removeRoles(_id));
		} catch (err) {
			console.log(err);
		}
	}
}

export function getRoles() {
	const db = database.active;
	return new Promise(async resolve => {
		try {
			// RC 0.70.0
			const result = await this.sdk.get('roles.list');

			if (!result.success) {
				return resolve();
			}

			const { roles } = result;

			if (roles && roles.length) {
				await db.action(async () => {
					const rolesCollections = db.get('roles');
					const allRolesRecords = await rolesCollections.query().fetch();

					// filter roles
					let rolesToCreate = roles.filter(i1 => !allRolesRecords.find(i2 => i1._id === i2.id));
					let rolesToUpdate = allRolesRecords.filter(i1 => roles.find(i2 => i1.id === i2._id));

					// Create
					rolesToCreate = rolesToCreate.map(role =>
						rolesCollections.prepareCreate(
							protectedFunction(r => {
								r._raw = sanitizedRaw({ id: role._id }, rolesCollections.schema);
								Object.assign(r, role);
							})
						)
					);

					// Update
					rolesToUpdate = rolesToUpdate.map(role => {
						const newRole = roles.find(r => r._id === role.id);
						return role.prepareUpdate(
							protectedFunction(r => {
								Object.assign(r, newRole);
							})
						);
					});

					const allRecords = [...rolesToCreate, ...rolesToUpdate];

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
