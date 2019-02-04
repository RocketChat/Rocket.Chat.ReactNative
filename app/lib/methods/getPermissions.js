import { InteractionManager } from 'react-native';

import database from '../realm';
import log from '../../utils/log';
import defaultPermissions from '../../constants/permissions';

export default async function() {
	try {
		// RC 0.66.0
		const result = await this.sdk.get('permissions.list');

		if (!result.success) {
			return;
		}
		const permissions = result.permissions.filter(permission => defaultPermissions.includes(permission._id));
		permissions
			.map((permission) => {
				permission._updatedAt = new Date();
				permission.roles = permission.roles.map(role => ({ value: role }));
				return permission;
			});

		InteractionManager.runAfterInteractions(
			() => database.write(() => permissions.forEach((permission) => {
				try {
					database.create('permissions', permission, true);
				} catch (e) {
					log('getPermissions create', e);
				}
			}))
		);
	} catch (e) {
		log('getPermissions', e);
	}
}
