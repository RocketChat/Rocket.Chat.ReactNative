import { Q } from '@nozbe/watermelondb';

import database from '../database';
import { type ICustomEmoji, type IEmoji, type TFrequentlyUsedEmojiModel } from '../../definitions';
import log from './helpers/log';
import { sanitizeLikeString } from '../database/utils';
import { DEFAULT_EMOJIS, emojis } from '../constants/emojis';

const FREQUENTLY_USED_TABLE = 'frequently_used_emojis';

// A frequently-used emoji is uniquely identified by its content + whether it is custom.
// We deliberately do NOT use the emoji content / custom-emoji name as the WatermelonDB
// record id: that content can be non-ASCII (CJK, ZWJ sequences, ...) and non-ASCII record
// ids do not round-trip across the native SQLite/JSI bridge. A mangled id desyncs the
// adapter's cached-id set from the JS RecordCache, making the entire .fetch() throw
// "Record ID ... was sent over the bridge, but it's not cached" and crashing every emoji
// surface (NATIVE-1192). Querying by the content field instead keeps content as a plain
// column value (which round-trips fine) and lets WatermelonDB own a safe, ASCII record id.
const getEmojiContent = (emoji: IEmoji) => (typeof emoji === 'string' ? emoji : emoji.name);

export const addFrequentlyUsed = async (emoji: IEmoji) => {
	const db = database.active;
	const freqEmojiCollection = db.get(FREQUENTLY_USED_TABLE);
	const content = getEmojiContent(emoji);
	const isCustom = typeof emoji !== 'string';
	try {
		const [existing] = (await freqEmojiCollection
			.query(Q.where('content', content), Q.where('is_custom', isCustom))
			.fetch()) as TFrequentlyUsedEmojiModel[];
		await db.write(async () => {
			if (existing) {
				await existing.update(f => {
					if (f.count) {
						f.count += 1;
					}
				});
			} else {
				await freqEmojiCollection.create(f => {
					const record = f as TFrequentlyUsedEmojiModel;
					// No record.id assignment: WatermelonDB generates a safe ASCII id.
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
		// A legacy non-ASCII record id can still desync the native bridge and reject the
		// whole fetch. Frequently-used emojis are a non-critical convenience cache, so we
		// log and degrade gracefully instead of crashing every emoji surface (NATIVE-1192).
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
