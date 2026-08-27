import { Q } from '@nozbe/watermelondb';

import database from '../database';
import { type ICustomEmoji, type IEmoji, type TFrequentlyUsedEmojiModel } from '../../definitions';
import log from './helpers/log';
import { sanitizeLikeString } from '../database/utils';
import { aliasesByEmojiName } from '../constants/emojis/data';
import { DEFAULT_EMOJIS, emojis } from '../constants/emojis/emojis';

const FREQUENTLY_USED_TABLE = 'frequently_used_emojis';

// Lower sorts first. An exact match on any name the emoji answers to beats a partial one, so
// `:fire` still offers `fire` now that ~2,000 names and their aliases are searched.
const NO_MATCH = 6;
const rankAgainst = (name: string, term: string): number => {
	if (name === term) return 0;
	const aliases = aliasesByEmojiName[name] ?? [];
	if (aliases.some(alias => alias === term)) return 1;
	if (name.startsWith(term)) return 2;
	if (aliases.some(alias => alias.startsWith(term))) return 3;
	if (name.includes(term)) return 4;
	if (aliases.some(alias => alias.includes(term))) return 5;
	return NO_MATCH;
};

export const searchEmojiNames = (keyword: string): string[] => {
	const term = keyword.toLowerCase();
	const matches: { name: string; rank: number }[] = [];
	emojis.forEach(name => {
		const rank = rankAgainst(name, term);
		if (rank !== NO_MATCH) {
			matches.push({ name, rank });
		}
	});
	// Array#sort is stable, so the picker's own order survives within a rank.
	return matches.sort((a, b) => a.rank - b.rank).map(match => match.name);
};

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
	const filteredEmojis = searchEmojiNames(keyword);
	return [...customEmojis, ...filteredEmojis];
};
