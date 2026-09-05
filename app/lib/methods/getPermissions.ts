import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import orderBy from 'lodash/orderBy';

import { setPermissions as setPermissionsAction } from '../../actions/permissions';
import { type IPermission, type TPermissionModel } from '../../definitions';
import log from './helpers/log';
import { store as reduxStore } from '../store/auxStore';
import database from '../database';
import sdk from '../services/sdk';
import protectedFunction from './helpers/protectedFunction';
import { compareServerVersion } from './helpers';

export const SUPPORTED_PERMISSIONS = [
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
	'start-discussion-other-user',
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
	'mobile-upload-file',
	'delete-own-message',
	'call-management',
	'test-push-notifications',
	'move-room-to-team',
	'create-team-channel',
	'create-team-group',
	'delete-team-channel',
	'delete-team-group',
	'mention-all',
	'mention-here',
	'allow-internal-voice-calls',
	'allow-external-voice-calls'
] as const;

export async function setPermissions(): Promise<void> {
	const db = database.active;
	const permissionsCollection = db.get('permissions');
	const allPermissions = await permissionsCollection
		.query(Q.where('id', Q.oneOf(SUPPORTED_PERMISSIONS as unknown as string[])))
		.fetch();
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
		return new Date(ordered[0]._updatedAt).toISOString();
	} catch (e) {
		log(e);
	}
	return null;
};

const updatePermissions = async ({ update = [], remove = [] }: { update?: IPermission[]; remove?: IPermission[] }) => {
	if (!(update.length || remove.length)) {
		return;
	}
	const db = database.active;
	const permissionsCollection = db.get('permissions');

	const uniqueUpdate = [...new Map(update.map(permission => [permission._id, permission])).values()];
	const touchedIds = [...remove.map(permission => permission._id), ...uniqueUpdate.map(permission => permission._id)];

	try {
		await db.write(async () => {
			const allRecords = (await permissionsCollection.query(Q.where('id', Q.oneOf(touchedIds))).fetch()) as TPermissionModel[];
			const recordById = new Map(allRecords.map(record => [record.id, record]));
			const batch: TPermissionModel[] = [];

			remove.forEach(permission => {
				const record = recordById.get(permission._id);
				if (record) {
					batch.push(record.prepareDestroyPermanently());
					recordById.delete(permission._id);
				}
			});

			uniqueUpdate.forEach(permission => {
				const assign = (p: TPermissionModel) => Object.assign(p, permission);
				const record = recordById.get(permission._id);
				batch.push(
					record
						? record.prepareUpdate(protectedFunction(assign))
						: permissionsCollection.prepareCreate(
								protectedFunction((p: TPermissionModel) => {
									p._raw = sanitizedRaw({ id: permission._id }, permissionsCollection.schema);
									assign(p);
								})
							)
				);
			});

			await db.batch(batch);
		});
		return true;
	} catch (e) {
		log(e);
	}
};

export function getPermissions(): Promise<void> {
	return new Promise(async resolve => {
		try {
			const serverVersion: string | null = reduxStore.getState().server.version;
			sdk.subscribe('stream-notify-logged', 'permissions-changed');
			// if server version is lower than 0.73.0, fetches from old api
			if (serverVersion && compareServerVersion(serverVersion, 'lowerThan', '0.73.0')) {
				// RC 0.66.0
				// @ts-ignore
				const result: any = await sdk.get('permissions.list');
				if (!result.success) {
					return resolve();
				}
				const changePermissions = await updatePermissions({ update: result.permissions });
				if (changePermissions) {
					setPermissions();
				}
				return resolve();
			}

			const params: { updatedSince?: string } = {};
			const allRecords = (await database.active.get('permissions').query().fetch()) as TPermissionModel[];
			const updatedSince = getUpdatedSince(allRecords);
			if (updatedSince) {
				params.updatedSince = updatedSince;
			}
			// RC 0.73.0
			const result = await sdk.get('permissions.listAll', params);

			if (!result.success) {
				return resolve();
			}

			const changePermissions = await updatePermissions({ update: result.update, remove: result.remove });
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
