import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import { store as reduxStore } from '../store/auxStore';
import database from '../database';
import log from './helpers/log';
import { setCustomEmojis as setCustomEmojisAction } from '../../actions/customEmojis';
import { ICustomEmojiModel, TCustomEmojiModel, ICustomEmojis } from '../../definitions';
import sdk from '../services/sdk';
import { compareServerVersion } from './helpers';

interface IUpdateEmojis {
	update: TCustomEmojiModel[];
	remove?: TCustomEmojiModel[];
	allRecords: TCustomEmojiModel[];
}

const getUpdatedSince = (allEmojis: ICustomEmojiModel[]) => {
	if (!allEmojis.length) {
		return null;
	}
	const ordered = orderBy(
		allEmojis.filter(item => item._updatedAt !== null),
		['_updatedAt'],
		['desc']
	);
	return ordered && ordered[0]._updatedAt.toISOString();
};

const updateEmojis = async ({ update = [], remove = [], allRecords }: IUpdateEmojis) => {
	if (!((update && update.length) || (remove && remove.length))) {
		return;
	}
	const db = database.active;
	const emojisCollection = db.get('custom_emojis');
	let emojisToCreate: TCustomEmojiModel[] = [];
	let emojisToUpdate: TCustomEmojiModel[] = [];
	let emojisToDelete: TCustomEmojiModel[] = [];

	// Create or update
	if (update && update.length) {
		const filterEmojisToCreate = update.filter(i1 => !allRecords.find(i2 => i1._id === i2.id));
		const filterEmojisToUpdate = allRecords.filter(i1 => update.find(i2 => i1.id === i2._id));
		emojisToCreate = filterEmojisToCreate.map(emoji =>
			emojisCollection.prepareCreate(e => {
				e._raw = sanitizedRaw({ id: emoji._id }, emojisCollection.schema);
				Object.assign(e, emoji);
			})
		);
		emojisToUpdate = filterEmojisToUpdate.map(emoji => {
			const newEmoji = update.find(e => e._id === emoji.id);
			return emoji.prepareUpdate(e => {
				Object.assign(e, newEmoji);
			});
		});
	}

	if (remove && remove.length) {
		const filterEmojisToDelete = allRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
		emojisToDelete = filterEmojisToDelete.map(emoji => emoji.prepareDestroyPermanently());
	}

	try {
		await db.write(async () => {
			await db.batch([...emojisToCreate, ...emojisToUpdate, ...emojisToDelete]);
		});
		return true;
	} catch (e) {
		log(e);
	}
};

export async function setCustomEmojis() {
	const db = database.active;
	const emojisCollection = db.get('custom_emojis');
	const allEmojis = await emojisCollection.query().fetch();
	const parsed = allEmojis.reduce((ret: ICustomEmojis, item) => {
		if (item.name) {
			ret[item.name] = {
				name: item.name,
				extension: item.extension
			};
		}

		if (item.aliases) {
			item.aliases.forEach(alias => {
				if (item.name) {
					ret[alias] = {
						name: item.name,
						extension: item.extension
					};
				}
			});
		}

		return ret;
	}, {});
	reduxStore.dispatch(setCustomEmojisAction(parsed));
}

export function getCustomEmojis() {
	return new Promise<void>(async resolve => {
		try {
			const serverVersion = reduxStore.getState().server.version as string;
			const db = database.active;
			const emojisCollection = db.get('custom_emojis');
			const allRecords = await emojisCollection.query().fetch();
			const updatedSince = await getUpdatedSince(allRecords);

			// if server version is lower than 0.75.0, fetches from old api
			if (compareServerVersion(serverVersion, 'lowerThan', '0.75.0')) {
				// RC 0.61.0
				// @ts-ignore
				const result = await sdk.get('emoji-custom');
				// @ts-ignore
				let { emojis } = result;
				emojis = emojis.filter((emoji: TCustomEmojiModel) => !updatedSince || emoji._updatedAt.toISOString() > updatedSince);
				const changedEmojis = await updateEmojis({ update: emojis, allRecords });

				// `setCustomEmojis` is fired on selectServer
				// We run it again only if emojis were changed
				if (changedEmojis) {
					setCustomEmojis();
				}
				return resolve();
			}
			const params: { updatedSince: string } = { updatedSince: '' };
			if (updatedSince) {
				params.updatedSince = updatedSince;
			}

			// RC 0.75.0
			const result = await sdk.get('emoji-custom.list', params);

			if (!result.success) {
				return resolve();
			}

			const { emojis } = result;
			// @ts-ignore
			const { update, remove } = emojis;
			const changedEmojis = await updateEmojis({ update, remove, allRecords });

			// `setCustomEmojis` is fired on selectServer
			// We run it again only if emojis were changed
			if (changedEmojis) {
				setCustomEmojis();
			}

			return resolve();
		} catch (e) {
			log(e);
			return resolve();
		}
	});
}
