import { InteractionManager } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import log from '../../utils/log';
import defaultPermissions from '../../constants/permissions';
import { appDatabase } from '../database';

/**
 * FIXME: https://github.com/RocketChat/Rocket.Chat.ReactNative/issues/634
 * We should check if the server is +0.73 and call /api/v1/permissions.listAll instead
 */
export default async function() {
	try {
		// RC 0.66.0
		const result = await this.sdk.get('permissions.list');

		if (!result.success) {
			return;
		}

		InteractionManager.runAfterInteractions(async() => {
			const permissions = result.permissions.filter(permission => defaultPermissions.includes(permission._id));
			const permissionsCollection = appDatabase.collections.get('permissions');
			const permissionsRolesCollection = appDatabase.collections.get('permissions_roles');

			const records = [
				appDatabase.action(async() => {
					await permissionsRolesCollection.query().destroyAllPermanently();
				})
			];

			permissions.forEach((permission) => {
				records.push(appDatabase.action(async() => {
					let permissionRecord;
					try {
						permissionRecord = await permissionsCollection.find(permission._id);
					} catch (error) {
						permissionRecord = await permissionsCollection.create((newPermission) => {
							newPermission._raw = sanitizedRaw({
								id: permission._id
							}, permissionsCollection.schema);
						});
					}

					if (permission.roles) {
						permission.roles.forEach(async(role) => {
							try {
								await permissionsRolesCollection.create((pr) => {
									pr.permissionId = permissionRecord.id;
									pr.roleId = role;
								});
							} catch (error) {
								console.log('Error creating permissionRole -> error', error);
							}
						});
					}
				}));
			});
			await Promise.all(records);
		});
	} catch (e) {
		log('getPermissions', e);
	}
}
