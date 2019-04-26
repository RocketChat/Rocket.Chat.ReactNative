import { InteractionManager } from 'react-native';

import reduxStore from '../createStore';
import database from '../realm';
import * as actions from '../../actions';
import log from '../../utils/log';

const getUpdatedSince = () => {
	const emoji = database.objects('customEmojis').sorted('_updatedAt', true)[0];
	return emoji && emoji._updatedAt.toISOString();
};

export default async function() {
	try {
		const params = {};
		const updatedSince = getUpdatedSince();
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
				if (emojis.update && emojis.update.length) {
					emojis.update.forEach((emoji) => {
						try {
							database.create('customEmojis', emoji, true);
						} catch (e) {
							log('getEmojis create', e);
						}
					});
				}

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
	} catch (e) {
		log('getCustomEmojis', e);
	}
}
