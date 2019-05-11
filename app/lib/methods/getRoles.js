import { InteractionManager } from 'react-native';

import database from '../realm';
import log from '../../utils/log';

export default async function() {
	try {
		// RC 0.70.0
		const result = await this.sdk.get('roles.list');

		if (!result.success) {
			return;
		}

		const { roles } = result;

		if (roles && roles.length) {
			InteractionManager.runAfterInteractions(() => {
				database.write(() => roles.forEach((role) => {
					try {
						database.create('roles', role, true);
					} catch (e) {
						log('getRoles create', e);
					}
				}));
			});
		}
	} catch (e) {
		log('getRoles', e);
	}
}
