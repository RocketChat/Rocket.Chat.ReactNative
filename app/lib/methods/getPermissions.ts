import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';
import orderBy from 'lodash/orderBy';
import { IPermissions } from 'reducers/permissions';

import { compareServerVersion } from '../utils';
import database from '../database';
import log from '../../utils/log';
import { store as reduxStore } from '../auxStore';
import RocketChat from '../rocketchat';
import { setPermissions as setPermissionsAction } from '../../actions/permissions';
import protectedFunction from './helpers/protectedFunction';
import { IRocketChat, TPermissionModel } from '../../definitions';

const PERMISSIONS = [
	'add-user-to-any-c-room',
	'add-user-to-any-p-room',
	'add-user-to-joined-room',
	'add-team-channel',
	'archive-room',
	'auto-translate',
	'create-invite-links',
	'create-c',
	'create-p',
	'create-d',
	'start-discussion',
	'create-team',
	'delete-c',
	'delete-message',
	'delete-p',
	'delete-team',
	'edit-message',
	'edit-room',
	'edit-team-member',
	'edit-team-channel',
	'force-delete-message',
	'mute-user',
	'pin-message',
	'post-readonly',
	'remove-user',
	'remove-team-channel',
	'set-leader',
	'set-moderator',
	'set-owner',
	'set-react-when-readonly',
	'set-readonly',
	'toggle-room-e2e-encryption',
	'transfer-livechat-guest',
	'unarchive-room',
	'view-broadcast-member-list',
	'view-privileged-setting',
	'view-room-administration',
	'view-statistics',
	'view-user-administration',
	'view-all-teams',
	'view-all-team-channels',
	'convert-team',
	'edit-omnichannel-contact',
	'edit-livechat-room-customfields',
	'view-canned-responses',
	'mobile-upload-file'
];

export async function setPermissions(): Promise<void> {
	const db = database.active;
	const permissionsCollection = db.get('permissions');
	const allPermissions = await permissionsCollection.query(Q.where('id', Q.oneOf(PERMISSIONS))).fetch();
	const parsed = allPermissions.reduce((acc, item) => ({ ...acc, [item.id]: item.roles }), {});

	reduxStore.dispatch(setPermissionsAction(parsed));
}

const getUpdatedSince = (allRecords: TPermissionModel[]) => {
	try {
		if (!allRecords.length) {
			return null;
		}
		const ordered = orderBy(
			allRecords.filter(item => item._updatedAt !== null),
			['_updatedAt'],
			['desc']
		);
		return ordered && ordered[0]._updatedAt.toISOString();
	} catch (e) {
		log(e);
	}
	return null;
};

const updatePermissions = async ({
	update = [],
	remove = [],
	allRecords
}: {
	update?: IPermissions[];
	remove?: IPermissions[];
	allRecords: TPermissionModel[];
}) => {
	if (!((update && update.length) || (remove && remove.length))) {
		return;
	}
	const db = database.active;
	const permissionsCollection = db.get('permissions');

	const batch: TPermissionModel[] = [];

	// Delete
	if (remove?.length) {
		const filteredPermissionsToDelete = allRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
		const permissionsToDelete = filteredPermissionsToDelete.map(permission => permission.prepareDestroyPermanently());
		batch.push(...permissionsToDelete);
	}

	// Create or update
	if (update?.length) {
		const filteredPermissionsToCreate = update.filter(i1 => !allRecords.find(i2 => i1._id === i2.id));
		const filteredPermissionsToUpdate = allRecords.filter(i1 => update.find(i2 => i1.id === i2._id));
		const permissionsToCreate = filteredPermissionsToCreate.map(permission =>
			permissionsCollection.prepareCreate(
				protectedFunction((p: TPermissionModel) => {
					p._raw = sanitizedRaw({ id: permission._id }, permissionsCollection.schema);
					Object.assign(p, permission);
				})
			)
		);
		const permissionsToUpdate = filteredPermissionsToUpdate.map(permission => {
			const newPermission = update.find(p => p._id === permission.id);
			return permission.prepareUpdate(
				protectedFunction((p: TPermissionModel) => {
					Object.assign(p, newPermission);
				})
			);
		});

		batch.push(...permissionsToCreate, ...permissionsToUpdate);
	}

	try {
		await db.write(async () => {
			await db.batch(...batch);
		});
		return true;
	} catch (e) {
		log(e);
	}
};

export function getPermissions(this: IRocketChat): Promise<void> {
	return new Promise(async resolve => {
		try {
			const serverVersion: string | null = reduxStore.getState().server.version;
			const db = database.active;
			const permissionsCollection = db.get('permissions');
			const allRecords = await permissionsCollection.query().fetch();
			RocketChat.subscribe('stream-notify-logged', 'permissions-changed');
			// if server version is lower than 0.73.0, fetches from old api
			if (serverVersion && compareServerVersion(serverVersion, 'lowerThan', '0.73.0')) {
				// RC 0.66.0
				const result = await this.sdk.get('permissions.list');
				if (!result.success) {
					return resolve();
				}
				const changePermissions = await updatePermissions({ update: result.permissions, allRecords });
				if (changePermissions) {
					setPermissions();
				}
				return resolve();
			}

			const params: { updatedSince?: string } = {};
			const updatedSince = getUpdatedSince(allRecords);
			if (updatedSince) {
				params.updatedSince = updatedSince;
			}
			// RC 0.73.0
			const result = await this.sdk.get('permissions.listAll', params);

			if (!result.success) {
				return resolve();
			}

			const changePermissions = await updatePermissions({ update: result.update, remove: result.delete, allRecords });
			if (changePermissions) {
				setPermissions();
			}
			return resolve();
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
