import { Q } from '@nozbe/watermelondb';

import { IEmoji } from '../../definitions';
import { sanitizeLikeString } from '../../lib/database/utils';
import { emojis } from './data';
import database from '../../lib/database';

export const searchEmojis = async (keyword: string): Promise<IEmoji[]> => {
	const likeString = sanitizeLikeString(keyword);
	const whereClause = [];
	if (likeString) {
		whereClause.push(Q.where('name', Q.like(`${likeString}%`)));
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
