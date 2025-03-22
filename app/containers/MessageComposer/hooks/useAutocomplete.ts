import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import { IAutocompleteEmoji, IAutocompleteUserRoom, TAutocompleteItem, TAutocompleteType } from '../interfaces';
import { search } from '../../../lib/methods';
import { sanitizeLikeString } from '../../../lib/database/utils';
import database from '../../../lib/database';
import { emojis } from '../../../lib/constants';
import { ICustomEmoji } from '../../../definitions';
import { Services } from '../../../lib/services';
import log from '../../../lib/methods/helpers/log';
import I18n from '../../../i18n';
import { NO_CANNED_RESPONSES } from '../constants';

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

export const useAutocomplete = ({
	text,
	type,
	rid,
	commandParams
}: {
	rid?: string;
	type: TAutocompleteType;
	text: string;
	commandParams?: string;
}): TAutocompleteItem[] => {
	const [items, setItems] = useState<TAutocompleteItem[]>([]);
	useEffect(() => {
		const getAutocomplete = async () => {
			try {
				if (!rid || !type) {
					setItems([]);
					return;
				}

				// remove existing loading skeleton from items
				const loadingIndex = items.findIndex(item => item.id === 'loading');
				if (loadingIndex !== -1) {
					items.splice(loadingIndex, 1);
				}

				// add loading skeleton
				items.unshift({ id: 'loading', type: 'loading' });
				setItems(items);

				if (type === '@' || type === '#') {
					const res = await search({ text, filterRooms: type === '#', filterUsers: type === '@', rid });
					const parsedRes: IAutocompleteUserRoom[] = res
						// TODO: need to refactor search to have a more predictable return type
						.map((item: any) => ({
							id: type === '@' ? item._id : item.rid,
							title: item.fname || item.name || item.username,
							subtitle: item.username || item.name,
							outside: item.outside,
							t: item.t ?? 'd',
							status: item.status,
							teamMain: item.teamMain,
							type
						})) as IAutocompleteUserRoom[];
					if (type === '@') {
						if ('all'.includes(text.toLocaleLowerCase())) {
							parsedRes.push({
								id: 'all',
								title: 'all',
								subtitle: I18n.t('Notify_all_in_this_room'),
								type,
								t: 'd'
							});
						}
						if ('here'.includes(text.toLocaleLowerCase())) {
							parsedRes.push({
								id: 'here',
								title: 'here',
								subtitle: I18n.t('Notify_active_in_this_room'),
								type,
								t: 'd'
							});
						}
					}
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
				if (type === '/preview') {
					if (!commandParams) {
						setItems([]);
						return;
					}
					const response = await Services.getCommandPreview(text, rid, commandParams);
					if (response.success) {
						const previewItems = (response.preview?.items || []).map(item => ({
							id: item.id,
							preview: item,
							type,
							text,
							params: commandParams
						}));
						setItems(previewItems);
					}
				}
				if (type === '!') {
					const res = await Services.getListCannedResponse({ text });
					if (res.success) {
						if (res.cannedResponses.length === 0) {
							setItems([
								{
									id: NO_CANNED_RESPONSES,
									title: NO_CANNED_RESPONSES,
									type
								}
							]);
							return;
						}

						const cannedResponses = res.cannedResponses.map(cannedResponse => ({
							id: cannedResponse._id,
							title: cannedResponse.shortcut,
							subtitle: cannedResponse.text,
							type
						}));
						setItems(cannedResponses);
					}
				}
			} catch (e) {
				log(e);
				setItems([]);
			}
		};
		getAutocomplete();
	}, [text, type, rid, commandParams]);
	return items;
};
