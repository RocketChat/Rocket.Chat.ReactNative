import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { IAutocompleteItem, TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';
// import { sanitizeLikeString } from '../../../lib/database/utils';
// import database from '../../../lib/database';
// import { emojis } from '../../../lib/constants';

// const MENTIONS_COUNT_TO_DISPLAY = 4;

// const getCustomEmojis = async (keyword: any, count: number) => {
// 	const likeString = sanitizeLikeString(keyword);
// 	const whereClause = [];
// 	if (likeString) {
// 		whereClause.push(Q.where('name', Q.like(`${likeString}%`)));
// 	}
// 	const db = database.active;
// 	const customEmojisCollection = db.get('custom_emojis');
// 	const customEmojis = await (await customEmojisCollection.query(...whereClause).fetch()).slice(0, count);
// 	return customEmojis;
// };

export const useAutocomplete = ({ text, type, rid }: { text: string; type: TAutocompleteType; rid: string }) => {
	const [items, setItems] = useState<IAutocompleteItem[]>([]);
	useEffect(() => {
		const getAutocomplete = async () => {
			if (type === '@' || type === '#') {
				const res = await search({ text, filterRooms: type === '#', filterUsers: type === '@', rid });
				console.log('🚀 ~ file: useAutocomplete.ts:12 ~ getAutocomplete ~ res:', res);
				const parsedRes = res.map(item => ({
					// @ts-ignore
					id: type === '@' ? item._id : item.rid,
					// @ts-ignore
					title: item.fname || item.name || item.username,
					// @ts-ignore
					subtitle: item.username || item.name,
					// @ts-ignore
					outside: item.outside,
					// @ts-ignore
					t: item.t ?? 'd',
					// @ts-ignore
					status: item.status,
					// @ts-ignore
					teamMain: item.teamMain
				}));
				setItems(parsedRes);
			}
			// if (type === ':') {
			// 	const customEmojis = await getCustomEmojis(text, MENTIONS_COUNT_TO_DISPLAY);
			// 	const filteredEmojis = emojis.filter(emoji => emoji.indexOf(text) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
			// 	const mergedEmojis = [...customEmojis, ...filteredEmojis].slice(0, MENTIONS_COUNT_TO_DISPLAY);
			// 	console.log('🚀 ~ file: useAutocomplete.ts:51 ~ getAutocomplete ~ mergedEmojis:', mergedEmojis);
			// 	const parsedEmojis = mergedEmojis.map(emoji => ({
			// 		id: emoji.name,
			// 		title: `:${emoji.name}:`
			// 		// @ts-ignore
			// 		// extension: emoji.extension
			// 	}));
			// 	setItems(parsedEmojis);
			// 	// this.setState({ mentions: mergedEmojis || [], mentionLoading: false });
			// }
		};
		getAutocomplete();
	}, [text, type, rid]);
	return items;
};
