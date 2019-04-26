import { InteractionManager } from 'react-native';
import semver from 'semver';

import reduxStore from '../createStore';
import database from '../realm';
import * as actions from '../../actions';
import log from '../../utils/log';

const getUpdatedSince = () => {
	const emoji = database.objects('customEmojis').sorted('_updatedAt', true)[0];
	return emoji && emoji._updatedAt.toISOString();
};

const create = (customEmojis) => {
	if (customEmojis && customEmojis.length) {
		customEmojis.forEach((emoji) => {
			try {
				database.create('customEmojis', emoji, true);
			} catch (e) {
				log('getEmojis create', e);
			}
		});
	}
};


export default async function() {
	try {
		const serverVersion = reduxStore.getState().server.version;
		const updatedSince = getUpdatedSince();

		// if server version is lower than 0.75.0, fetches from old api
		if (semver.lt(serverVersion, '0.75.0')) {
			// RC 0.61.0
			const result = await this.sdk.get('emoji-custom');

			InteractionManager.runAfterInteractions(() => {
				let { emojis } = result;
				emojis = emojis.filter(emoji => !updatedSince || emoji._updatedAt > updatedSince);
				database.write(() => {
					create(emojis);
				});
				reduxStore.dispatch(actions.setCustomEmojis(this.parseEmojis(result.emojis)));
			});
		} else {
			const params = {};
			if (updatedSince) {
				params.updatedSince = updatedSince;
			}

			// RC 0.75.0
			const result = await this.sdk.get('emoji-custom.list', params);

			if (!result.success) {
				return;
			}

			InteractionManager.runAfterInteractions(
				() => database.write(() => {
					const { emojis } = result;
					create(emojis.update);

					if (emojis.delete && emojis.delete.length) {
						emojis.delete.forEach((emoji) => {
							try {
								const emojiRecord = database.objectForPrimaryKey('customEmojis', emoji._id);
								if (emojiRecord) {
									database.delete(emojiRecord);
								}
							} catch (e) {
								log('getEmojis delete', e);
							}
						});
					}

					const allEmojis = database.objects('customEmojis');
					reduxStore.dispatch(actions.setCustomEmojis(this.parseEmojis(allEmojis)));
				})
			);
		}
	} catch (e) {
		log('getCustomEmojis', e);
	}
}
