import { InteractionManager } from 'react-native';
import semver from 'semver';

import database from '../realm';
import log from '../../utils/log';
import reduxStore from '../createStore';

const getUpdatedSince = () => {
	const permissions = database.objects('permissions').sorted('_updatedAt', true)[0];
	return permissions && permissions._updatedAt.toISOString();
};

const create = (permissions) => {
	if (permissions && permissions.length) {
		permissions.forEach((permission) => {
			try {
				database.create('permissions', permission, true);
			} catch (e) {
				log('err_get_permissions_create', e);
			}
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
					database.write(() => {
						create(result.permissions);
					});
					return resolve();
				});
			} else {
				const params = {};
				const updatedSince = getUpdatedSince();
				if (updatedSince) {
					params.updatedSince = updatedSince;
				}
				// RC 0.73.0
				const result = await this.sdk.get('permissions.listAll', params);

				if (!result.success) {
					return resolve();
				}

				InteractionManager.runAfterInteractions(
					() => database.write(() => {
						create(result.update);

						if (result.delete && result.delete.length) {
							result.delete.forEach((p) => {
								try {
									const permission = database.objectForPrimaryKey('permissions', p._id);
									if (permission) {
										database.delete(permission);
									}
								} catch (e) {
									log('err_get_permissions_delete', e);
								}
							});
						}
						return resolve();
					})
				);
			}
		} catch (e) {
			log('err_get_permissions', e);
			return resolve();
		}
	});
}
