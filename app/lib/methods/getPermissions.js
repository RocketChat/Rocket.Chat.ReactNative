import { InteractionManager } from 'react-native';
import semver from 'semver';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { orderBy } from 'lodash';
import { Q } from '@nozbe/watermelondb';

import database from '../database';
import log from '../../utils/log';
import reduxStore from '../createStore';
import protectedFunction from './helpers/protectedFunction';

const getUpdatedSince = async() => {
	try {
		const db = database.active;
		const permissionsCollection = db.collections.get('permissions');
		const permissions = await permissionsCollection.query(Q.where('_updated_at', Q.notEq(null))).fetch();
		const ordered = orderBy(permissions, ['_updatedAt'], ['desc']);
		return ordered && ordered[0]._updatedAt.toISOString();
	} catch (e) {
		log(e);
	}
	return null;
};

const create = (permissions, toDelete = null) => {
	const db = database.active;
	if (permissions && permissions.length) {
		db.action(async() => {
			const permissionsCollection = db.collections.get('permissions');
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
				await db.batch(...allRecords);
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
