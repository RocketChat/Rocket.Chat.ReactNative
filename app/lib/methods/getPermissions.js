import { InteractionManager } from 'react-native';
import semver from 'semver';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { orderBy } from 'lodash';

import watermelon from '../database';
import log from '../../utils/log';
import reduxStore from '../createStore';
import protectedFunction from './helpers/protectedFunction';

const getUpdatedSince = async() => {
	let permission = null;
	try {
		const { database } = watermelon;
		const permissionsCollection = database.collections.get('permissions');
		let permissions = await permissionsCollection.query().fetch();
		permissions = orderBy(permissions, ['_updatedAt'], ['asc']);
		[permission] = permissions;
	} catch (e) {
		log(e);
	}
	return permission && permission._updatedAt.toISOString();
};

const create = (permissions, toDelete = null) => {
	const { database } = watermelon;
	if (permissions && permissions.length) {
		database.action(async() => {
			const permissionsCollection = database.collections.get('permissions');
			const allPermissionRecords = await permissionsCollection.query().fetch();

			// filter permissions
			let permissionsToCreate = permissions.filter(i1 => !allPermissionRecords.find(i2 => i1._id === i2.id));
			let permissionsToUpdate = allPermissionRecords.filter(i1 => permissions.find(i2 => i1.id === i2._id));
			let permissionsToDelete = [];
			if (toDelete && toDelete.length) {
				permissionsToDelete = allPermissionRecords.filter(i1 => toDelete.find(i2 => i1.id === i2._id));
			}

			// Create
			permissionsToCreate = permissionsToCreate.map(permission => permissionsCollection.prepareCreate(protectedFunction((p) => {
				p._raw = sanitizedRaw({ id: permission._id }, permissionsCollection.schema);
				Object.assign(p, permission);
			})));

			// Update
			permissionsToUpdate = permissionsToUpdate.map((permission) => {
				const newPermission = permissions.find(p => p._id === permission.id);
				return permission.prepareUpdate(protectedFunction((p) => {
					Object.assign(p, newPermission);
				}));
			});

			// Delete
			permissionsToDelete = permissionsToDelete.map(permission => permission.prepareDestroyPermanently());

			const allRecords = [
				...permissionsToCreate,
				...permissionsToUpdate,
				...permissionsToDelete
			];

			try {
				await database.batch(...allRecords);
			} catch (e) {
				log(e);
			}
			return allRecords.length;
		});
	}
};

export default function() {
	return new Promise(async(resolve) => {
		try {
			const serverVersion = reduxStore.getState().server.version;

			// if server version is lower than 0.73.0, fetches from old api
			if (semver.lt(serverVersion, '0.73.0')) {
				// RC 0.66.0
				const result = await this.sdk.get('permissions.list');
				if (!result.success) {
					return resolve();
				}
				InteractionManager.runAfterInteractions(() => {
					create(result.permissions);
					return resolve();
				});
			} else {
				const params = {};
				const updatedSince = await getUpdatedSince();
				if (updatedSince) {
					params.updatedSince = updatedSince;
				}
				// RC 0.73.0
				const result = await this.sdk.get('permissions.listAll', params);

				if (!result.success) {
					return resolve();
				}

				InteractionManager.runAfterInteractions(
					() => {
						create(result.update, result.delete);
						return resolve();
					}
				);
			}
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
