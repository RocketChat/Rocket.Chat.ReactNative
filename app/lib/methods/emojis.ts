import { Q } from '../database/facade';
import database from '../database';
import { type ICustomEmoji, type IEmoji, type TFrequentlyUsedEmojiModel } from '../../definitions';
import log from './helpers/log';
import { sanitizeLikeString } from '../database/utils';
import { DEFAULT_EMOJIS, emojis } from '../constants/emojis';

const FREQUENTLY_USED_TABLE = 'frequently_used_emojis';

// Looked up by content, never used as the record id: emoji content / custom names can be
// non-ASCII and corrupt across the native SQLite bridge when used as WatermelonDB ids.
const getEmojiContent = (emoji: IEmoji) => (typeof emoji === 'string' ? emoji : emoji.name);

export const addFrequentlyUsed = async (emoji: IEmoji) => {
	const db = database.active;
	const freqEmojiCollection = db.get(FREQUENTLY_USED_TABLE);
	const content = getEmojiContent(emoji);
	const isCustom = typeof emoji !== 'string';
	try {
		await db.write(async () => {
			const [existing] = (await freqEmojiCollection
				.query(Q.where('content', content), Q.where('is_custom', isCustom))
				.fetch()) as TFrequentlyUsedEmojiModel[];
			if (existing) {
				await existing.update(f => {
					if (f.count) {
						f.count += 1;
					}
				});
			} else {
				await freqEmojiCollection.create(f => {
					const record = f as TFrequentlyUsedEmojiModel;
					record.content = content;
					record.isCustom = isCustom;
					if (isCustom) {
						record.extension = (emoji as ICustomEmoji).extension;
					}
					record.count = 1;
				});
			}
		});
	} catch (e) {
		log(e);
	}
};

export const getFrequentlyUsedEmojis = async (withDefaultEmojis = false): Promise<IEmoji[]> => {
	const db = database.active;
	try {
		const records = (await db.get(FREQUENTLY_USED_TABLE).query(Q.sortBy('count', Q.desc)).fetch()) as TFrequentlyUsedEmojiModel[];
		let frequentlyUsedEmojis: IEmoji[] = records.map(item => {
			if (item.isCustom) {
				return { name: item.content, extension: item.extension! }; // if isCustom is true, extension is not null
			}
			return item.content;
		});

		if (withDefaultEmojis && frequentlyUsedEmojis.length < DEFAULT_EMOJIS.length) {
			frequentlyUsedEmojis = frequentlyUsedEmojis
				.concat(DEFAULT_EMOJIS.filter(de => !frequentlyUsedEmojis.find(fue => typeof fue === 'string' && fue === de)))
				.slice(0, DEFAULT_EMOJIS.length);
		}

		return frequentlyUsedEmojis;
	} catch (e) {
		// A legacy non-ASCII id can still reject the fetch; degrade rather than crash the emoji UI.
		log(e);
		return withDefaultEmojis ? [...DEFAULT_EMOJIS] : [];
	}
};

export const searchEmojis = async (keyword: string): Promise<IEmoji[]> => {
	const likeString = sanitizeLikeString(keyword);
	const whereClause = [];
	if (likeString) {
		whereClause.push(Q.where('name', Q.like(`%${likeString}%`)));
	}
	const db = database.active;
	const customEmojisCollection = await db
		.get('custom_emojis')
		.query(...whereClause)
		.fetch();
	const customEmojis = customEmojisCollection?.map(emoji => ({
		name: emoji?.name,
		extension: emoji?.extension
	}));
	const filteredEmojis = emojis.filter(emoji => emoji.indexOf(keyword) !== -1);
	return [...customEmojis, ...filteredEmojis];
};
