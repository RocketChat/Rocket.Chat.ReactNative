import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';

import database from '../database';
import { IEmoji, TFrequentlyUsedEmojiModel } from '../../definitions';
import log from './helpers/log';
import { sanitizeLikeString } from '../database/utils';
import { emojis } from '../constants';

export const addFrequentlyUsed = async (emoji: IEmoji) => {
	const db = database.active;
	const freqEmojiCollection = db.get('frequently_used_emojis');
	let freqEmojiRecord: TFrequentlyUsedEmojiModel;
	try {
		if (typeof emoji === 'string') {
			freqEmojiRecord = await freqEmojiCollection.find(emoji);
		} else {
			freqEmojiRecord = await freqEmojiCollection.find(emoji.name);
		}
	} catch (error) {
		// Do nothing
	}

	try {
		await db.write(async () => {
			if (freqEmojiRecord) {
				await freqEmojiRecord.update(f => {
					if (f.count) {
						f.count += 1;
					}
				});
			} else {
				await freqEmojiCollection.create(f => {
					if (typeof emoji === 'string') {
						f._raw = sanitizedRaw({ id: emoji }, freqEmojiCollection.schema);
						Object.assign(f, { content: emoji, isCustom: false });
					} else {
						f._raw = sanitizedRaw({ id: emoji.name }, freqEmojiCollection.schema);
						Object.assign(f, { content: emoji.name, extension: emoji.extension, isCustom: true });
					}
					f.count = 1;
				});
			}
		});
	} catch (e) {
		log(e);
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
