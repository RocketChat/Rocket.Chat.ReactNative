import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { IAutocompleteEmoji, TAutocompleteItem, TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';
import { sanitizeLikeString } from '../../../lib/database/utils';
import database from '../../../lib/database';
import { emojis } from '../../../lib/constants';
import { ICustomEmoji, IEmoji } from '../../../definitions';

const MENTIONS_COUNT_TO_DISPLAY = 4;

const getCustomEmojis = async (keyword: string): Promise<ICustomEmoji[]> => {
	const likeString = sanitizeLikeString(keyword);
	const whereClause = [];
	if (likeString) {
		whereClause.push(Q.where('name', Q.like(`${likeString}%`)));
	}
	const db = database.active;
	const customEmojisCollection = db.get('custom_emojis');
	const customEmojis = await (await customEmojisCollection.query(...whereClause).fetch())
		.slice(0, MENTIONS_COUNT_TO_DISPLAY)
		.map(emoji => ({
			name: emoji.name,
			extension: emoji.extension
		}));
	return customEmojis;
};

export const useAutocomplete = ({ text, type, rid }: { text: string; type: TAutocompleteType; rid: string }) => {
	const [items, setItems] = useState<TAutocompleteItem[]>([]);
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
					teamMain: item.teamMain,
					type
				}));
				setItems(parsedRes);
			}
			if (type === ':') {
				const customEmojis = await getCustomEmojis(text);
				const filteredStandardEmojis = emojis.filter(emoji => emoji.indexOf(text) !== -1).slice(0, MENTIONS_COUNT_TO_DISPLAY);
				let mergedEmojis: IAutocompleteEmoji[] = customEmojis.map(emoji => ({
					id: emoji.name,
					emoji,
					type
				}));
				mergedEmojis = mergedEmojis.concat(
					filteredStandardEmojis.map(emoji => ({
						id: emoji,
						emoji,
						type
					}))
				);
				setItems(mergedEmojis);
			}
			if (type === '/') {
				const db = database.active;
				const commandsCollection = db.get('slash_commands');
				const likeString = sanitizeLikeString(text);
				const commands = await (
					await commandsCollection.query(Q.where('id', Q.like(`${likeString}%`))).fetch()
				).map(command => ({
					id: command.id,
					title: command.id,
					subtitle: command.description,
					type
				}));
				setItems(commands);
			}
		};
		getAutocomplete();
	}, [text, type, rid]);
	return items;
};
