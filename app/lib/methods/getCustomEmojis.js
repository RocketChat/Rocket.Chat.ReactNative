import { InteractionManager } from 'react-native';
import semver from 'semver';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
import watermelondb from '../database';
import log from '../../utils/log';
import { setCustomEmojis as setCustomEmojisAction } from '../../actions/customEmojis';

const getUpdatedSince = (allEmojis) => {
	if (!allEmojis.length) {
		return null;
	}
	const ordered = orderBy(allEmojis, ['_updatedAt'], ['desc']);
	return ordered && ordered[0]._updatedAt.toISOString();
};

const updateEmojis = async(emojis, allEmojisRecords, db, emojisCollection) => {
	await db.action(async() => {
		let emojisToCreate = emojis.filter(i1 => !allEmojisRecords.find(i2 => i1._id === i2.id));
		let emojisToUpdate = allEmojisRecords.filter(i1 => emojis.find(i2 => i1.id === i2._id));
		emojisToCreate = emojisToCreate.map(emoji => emojisCollection.prepareCreate((e) => {
			e._raw = sanitizedRaw({ id: emoji._id }, emojisCollection.schema);
			Object.assign(e, emoji);
		}));
		emojisToUpdate = emojisToUpdate.map((emoji) => {
			const newEmoji = emojis.find(e => e._id === emoji.id);
			return emoji.prepareUpdate((e) => {
				Object.assign(e, newEmoji);
			});
		});
		try {
			await db.batch(
				...emojisToCreate,
				...emojisToUpdate
			);
		} catch (e) {
			log(e);
		}
	});
};

export async function setCustomEmojis() {
	const watermelon = watermelondb.database;
	const emojisCollection = watermelon.collections.get('custom_emojis');
	const allEmojis = await emojisCollection.query().fetch();
	const parsed = allEmojis.reduce((ret, item) => {
		ret[item.name] = {
			name: item.name,
			extension: item.extension
		};
		item.aliases.forEach((alias) => {
			ret[alias] = {
				name: item.name,
				extension: item.extension
			};
		});
		return ret;
	}, {});
	reduxStore.dispatch(setCustomEmojisAction(parsed));
}

export function getCustomEmojis() {
	return new Promise(async(resolve) => {
		try {
			const serverVersion = reduxStore.getState().server.version;
			const watermelon = watermelondb.database;
			const emojisCollection = watermelon.collections.get('custom_emojis');
			const allEmojisRecords = await emojisCollection.query().fetch();
			const updatedSince = await getUpdatedSince(allEmojisRecords);

			// if server version is lower than 0.75.0, fetches from old api
			if (semver.lt(serverVersion, '0.75.0')) {
				// RC 0.61.0
				const result = await this.sdk.get('emoji-custom');

				InteractionManager.runAfterInteractions(async() => {
					let { emojis } = result;
					emojis = emojis.filter(emoji => !updatedSince || emoji._updatedAt > updatedSince);
					await updateEmojis(emojis, allEmojisRecords, watermelon, emojisCollection);
					if (emojis.length) {
						setCustomEmojis();
					}
					return resolve();
				});
			} else {
				const params = {};
				if (updatedSince) {
					params.updatedSince = updatedSince;
				}

				// RC 0.75.0
				const result = await this.sdk.get('emoji-custom.list', params);

				if (!result.success) {
					return resolve();
				}

				InteractionManager.runAfterInteractions(
					async() => {
						const { emojis } = result;
						let changedEmojis = false;
						if (emojis.update && emojis.update.length) {
							await updateEmojis(emojis.update, allEmojisRecords, watermelon, emojisCollection);
							changedEmojis = true;
						}

						if (emojis.remove && emojis.remove.length) {
							let emojisToDelete = allEmojisRecords.filter(i1 => emojis.remove.find(i2 => i1.id === i2._id));
							emojisToDelete = emojisToDelete.map(emoji => emoji.prepareDestroyPermanently());
							await watermelon.action(async() => {
								await watermelon.batch(...emojisToDelete);
							});
							changedEmojis = true;
						}

						// `setCustomEmojis` is fired on selectServer
						// We run it again only if emojis were changed
						if (changedEmojis) {
							setCustomEmojis();
						}
					}
				);
			}
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
