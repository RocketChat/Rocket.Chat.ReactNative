import { InteractionManager } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
import database from '../realm';
import * as actions from '../../actions';
import log from '../../utils/log';
import { appDatabase } from '../database';

const getLastMessage = () => {
	const setting = database.objects('customEmojis').sorted('_updatedAt', true)[0];
	return setting && setting._updatedAt;
};

// TODO: fix api (get emojis by date/version....)
export default async function() {
	try {
		const lastMessage = getLastMessage();
		// RC 0.61.0
		const result = await this.sdk.get('emoji-custom');
		let { emojis } = result;
		emojis = emojis.filter(emoji => !lastMessage || emoji._updatedAt > lastMessage);

		InteractionManager.runAfterInteractions(async() => {
			// database.write(() => {
			// 	emojis.forEach(emoji => database.create('customEmojis', emoji, true));
			// });

			const emojisCollection = appDatabase.collections.get('custom_emojis');
			const emojisAliasesCollection = appDatabase.collections.get('custom_emojis_aliases');
			const records = [];
			emojis.forEach((emoji) => {
				records.push(appDatabase.action(async() => {
					let emojiRecord;
					try {
						emojiRecord = await emojisCollection.find(emoji._id);
						emojiRecord.update((e) => {
							e.name = emoji.name;
							e.extension = emoji.extension;
							e.updatedAt = emoji._updatedAt;
						});
						await emojiRecord.aliases.destroyAllPermanently();
					} catch (error) {
						emojiRecord = await emojisCollection.create((newEmoji) => {
							newEmoji._raw = sanitizedRaw({
								id: emoji._id,
								name: emoji.name,
								extension: emoji.extension,
								updatedAt: emoji._updatedAt
							}, emojisCollection.schema);
						});
					}

					if (emoji.aliases) {
						emoji.aliases.forEach(async(alias) => {
							await emojisAliasesCollection.create((a) => {
								a.alias = alias;
								a.customEmoji.set(emojiRecord);
							});
						});
					}
				}));
			});
			await Promise.all(records);
		});

		// const reduxEmojis = this._prepareEmojis(emojis);
		// reduxStore.dispatch(actions.setCustomEmojis(this.parseEmojis(reduxEmojis)));
	} catch (e) {
		log('getCustomEmojis', e);
	}
}
