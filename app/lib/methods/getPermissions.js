import { InteractionManager } from 'react-native';
import lt from 'semver/functions/lt';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import orderBy from 'lodash/orderBy';
import { Q } from '@nozbe/watermelondb';

import database from '../database';
import log from '../../utils/log';
import reduxStore from '../createStore';
import protectedFunction from './helpers/protectedFunction';
import { setPermissions as setPermissionsAction, clearPermissions as clearPermissionsAction } from '../../actions/permissions';

const PERMISSIONS = [
	'edit-message',
	'delete-message',
	'force-delete-message',
	'pin-message',
	'post-readonly',
	'add-user-to-joined-room',
	'add-user-to-any-c-room',
	'add-user-to-any-p-room',
	'create-invite-links',
	'edit-room',
	'toggle-room-e2e-encryption',
	'view-broadcast-member-list',
	'transfer-livechat-guest',
	'set-readonly',
	'set-react-when-readonly',
	'archive-room',
	'unarchive-room',
	'delete-c',
	'delete-p',
	'edit-room',
	'mute-user',
	'set-leader',
	'set-owner',
	'set-moderator',
	'remove-user',
	'view-statistics',
	'view-room-administration',
	'view-user-administration',
	'view-privileged-setting'
];

export async function setPermissions() {
	const db = database.active;
	const permissionsCollection = db.collections.get('permissions');
	const allPermissions = await permissionsCollection.query(Q.where('id', Q.oneOf(PERMISSIONS))).fetch();
	const parsed = allPermissions.reduce((acc, item) => ({ ...acc, [item.id]: item.roles }), {});

	reduxStore.dispatch(clearPermissionsAction());
	reduxStore.dispatch(setPermissionsAction(parsed));
}

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
		return true;
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
			if (serverVersion && lt(serverVersion, '0.73.0')) {
				// RC 0.66.0
				const result = await this.sdk.get('permissions.list');
				if (!result.success) {
					return resolve();
				}
				InteractionManager.runAfterInteractions(async() => {
					const changePermissions = await updatePermissions({ update: result.permissions, allRecords });
					if (changePermissions) {
						setPermissions();
					}
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
					const changePermissions = await updatePermissions({ update: result.update, remove: result.delete, allRecords });
					if (changePermissions) {
						setPermissions();
					}
					return resolve();
				});
			}
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
