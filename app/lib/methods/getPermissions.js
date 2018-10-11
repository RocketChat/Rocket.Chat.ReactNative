import { InteractionManager } from 'react-native';
import * as SDK from '@rocket.chat/sdk';

import database from '../realm';
import log from '../../utils/log';
import defaultPermissions from '../../constants/permissions';

const getLastUpdate = () => {
	const setting = database.objects('permissions').sorted('_updatedAt', true)[0];
	return setting && setting._updatedAt;
};

export default async function() {
	try {
		const lastUpdate = getLastUpdate();
		const result = await (!lastUpdate
			? SDK.driver.asyncCall('permissions/get')
			: SDK.driver.asyncCall('permissions/get', new Date(lastUpdate)));
		const permissions = (result.update || result).filter(permission => defaultPermissions.includes(permission._id));
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
