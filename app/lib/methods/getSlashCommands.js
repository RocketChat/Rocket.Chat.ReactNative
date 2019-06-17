import { InteractionManager } from 'react-native';

import database from '../realm';
import log from '../../utils/log';

export default function() {
	return new Promise(async(resolve) => {
		try {
			// RC 0.60.2
			const result = await this.sdk.get('commands.list');

			if (!result.success) {
				log('getSlashCommand fetch', result);
				return resolve();
			}

			const { commands } = result;

			if (commands && commands.length) {
				InteractionManager.runAfterInteractions(() => {
					database.write(() => commands.forEach((command) => {
						try {
							database.create('slashCommand', command, true);
						} catch (e) {
							log('get_slash_command', e);
						}
					}));
					return resolve();
				});
			}
		} catch (e) {
			log('err_get_slash_command', e);
			return resolve();
		}
	});
}
