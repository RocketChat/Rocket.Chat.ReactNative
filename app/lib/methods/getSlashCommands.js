import { InteractionManager } from 'react-native';

import database from '../realm';
import log from '../../utils/log';

export default async function() {
	try {
		// RC 0.70.0
		const result = await this.sdk.get('commands.list');

		if (!result.success) {
			log('getSlashCommand fetch', result);
			return;
		}

		const { commands } = result;

		if (commands && commands.length) {
			InteractionManager.runAfterInteractions(() => {
				database.write(() => commands.forEach((command) => {
					try {
						database.create('slashCommand', command, true);
					} catch (e) {
						log('getCommand create', e);
					}
				}));
			});
		}
	} catch (e) {
		log('getCommand', e);
	}
}
