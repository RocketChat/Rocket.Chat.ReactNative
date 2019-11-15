import { InteractionManager } from 'react-native';
import semver from 'semver';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { orderBy } from 'lodash';

import database from '../database';
import log from '../../utils/log';
import reduxStore from '../createStore';
import protectedFunction from './helpers/protectedFunction';

const getUpdatedSince = (allRecords) => {
	try {
		if (!allRecords.length) {
			return null;
		}
		const ordered = orderBy(allRecords.filter(item => item._updatedAt !== null), ['_updatedAt'], ['desc']);
		return ordered && ordered[0]._updatedAt.toISOString();
	} catch (e) {
		log(e);
	}
	return null;
};

const updatePermissions = async({ update = [], remove = [], allRecords }) => {
	if (!((update && update.length) || (remove && remove.length))) {
		return;
	}
	const db = database.active;
	const permissionsCollection = db.collections.get('permissions');

	// filter permissions
	let permissionsToCreate = [];
	let permissionsToUpdate = [];
	let permissionsToDelete = [];

	// Create or update
	if (update && update.length) {
		permissionsToCreate = update.filter(i1 => !allRecords.find(i2 => i1._id === i2.id));
		permissionsToUpdate = allRecords.filter(i1 => update.find(i2 => i1.id === i2._id));
		permissionsToCreate = permissionsToCreate.map(permission => permissionsCollection.prepareCreate(protectedFunction((p) => {
			p._raw = sanitizedRaw({ id: permission._id }, permissionsCollection.schema);
			Object.assign(p, permission);
		})));
		permissionsToUpdate = permissionsToUpdate.map((permission) => {
			const newPermission = update.find(p => p._id === permission.id);
			return permission.prepareUpdate(protectedFunction((p) => {
				Object.assign(p, newPermission);
			}));
		});
	}

	// Delete
	if (remove && remove.length) {
		permissionsToDelete = allRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
		permissionsToDelete = permissionsToDelete.map(permission => permission.prepareDestroyPermanently());
	}

	const batch = [
		...permissionsToCreate,
		...permissionsToUpdate,
		...permissionsToDelete
	];

	try {
		await db.action(async() => {
			await db.batch(...batch);
		});
	} catch (e) {
		log(e);
	}
};

export default function() {
	return new Promise(async(resolve) => {
		try {
			const serverVersion = reduxStore.getState().server.version;
			const db = database.active;
			const permissionsCollection = db.collections.get('permissions');
			const allRecords = await permissionsCollection.query().fetch();

			// if server version is lower than 0.73.0, fetches from old api
			if (serverVersion && semver.lt(serverVersion, '0.73.0')) {
				// RC 0.66.0
				const result = await this.sdk.get('permissions.list');
				if (!result.success) {
					return resolve();
				}
				InteractionManager.runAfterInteractions(async() => {
					await updatePermissions({ update: result.permissions, allRecords });
					return resolve();
				});
			} else {
				const params = {};
				const updatedSince = await getUpdatedSince(allRecords);
				if (updatedSince) {
					params.updatedSince = updatedSince;
				}
				// RC 0.73.0
				const result = await this.sdk.get('permissions.listAll', params);

				if (!result.success) {
					return resolve();
				}

				InteractionManager.runAfterInteractions(async() => {
					await updatePermissions({ update: result.update, remove: result.delete, allRecords });
					return resolve();
				});
			}
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
