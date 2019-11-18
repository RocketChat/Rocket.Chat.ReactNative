import { InteractionManager } from 'react-native';
import semver from 'semver';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
import database from '../database';
import log from '../../utils/log';
import { setCustomEmojis as setCustomEmojisAction } from '../../actions/customEmojis';

const getUpdatedSince = (allEmojis) => {
	if (!allEmojis.length) {
		return null;
	}
	const ordered = orderBy(allEmojis.filter(item => item._updatedAt !== null), ['_updatedAt'], ['desc']);
	return ordered && ordered[0]._updatedAt.toISOString();
};

const updateEmojis = async({ update = [], remove = [], allRecords }) => {
	if (!((update && update.length) || (remove && remove.length))) {
		return;
	}
	const db = database.active;
	const emojisCollection = db.collections.get('custom_emojis');
	let emojisToCreate = [];
	let emojisToUpdate = [];
	let emojisToDelete = [];

	// Create or update
	if (update && update.length) {
		emojisToCreate = update.filter(i1 => !allRecords.find(i2 => i1._id === i2.id));
		emojisToUpdate = allRecords.filter(i1 => update.find(i2 => i1.id === i2._id));
		emojisToCreate = emojisToCreate.map(emoji => emojisCollection.prepareCreate((e) => {
			e._raw = sanitizedRaw({ id: emoji._id }, emojisCollection.schema);
			Object.assign(e, emoji);
		}));
		emojisToUpdate = emojisToUpdate.map((emoji) => {
			const newEmoji = update.find(e => e._id === emoji.id);
			return emoji.prepareUpdate((e) => {
				Object.assign(e, newEmoji);
			});
		});
	}

	if (remove && remove.length) {
		emojisToDelete = allRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
		emojisToDelete = emojisToDelete.map(emoji => emoji.prepareDestroyPermanently());
	}

	try {
		await db.action(async() => {
			await db.batch(
				...emojisToCreate,
				...emojisToUpdate,
				...emojisToDelete
			);
		});
		return true;
	} catch (e) {
		log(e);
	}
};

export async function setCustomEmojis() {
	const db = database.active;
	const emojisCollection = db.collections.get('custom_emojis');
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
			const db = database.active;
			const emojisCollection = db.collections.get('custom_emojis');
			const allRecords = await emojisCollection.query().fetch();
			const updatedSince = await getUpdatedSince(allRecords);

			// if server version is lower than 0.75.0, fetches from old api
			if (serverVersion && semver.lt(serverVersion, '0.75.0')) {
				// RC 0.61.0
				const result = await this.sdk.get('emoji-custom');

				InteractionManager.runAfterInteractions(async() => {
					let { emojis } = result;
					emojis = emojis.filter(emoji => !updatedSince || emoji._updatedAt > updatedSince);
					const changedEmojis = await updateEmojis({ update: emojis, allRecords });

					// `setCustomEmojis` is fired on selectServer
					// We run it again only if emojis were changed
					if (changedEmojis) {
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

				InteractionManager.runAfterInteractions(async() => {
					const { emojis } = result;
					const { update, remove } = emojis;
					const changedEmojis = await updateEmojis({ update, remove, allRecords });

					// `setCustomEmojis` is fired on selectServer
					// We run it again only if emojis were changed
					if (changedEmojis) {
						setCustomEmojis();
					}
				});
			}
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
