import { useEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-native';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../../lib/database';
import { IEmoji, TFrequentlyUsedEmojiModel } from '../../definitions';
import { DEFAULT_EMOJIS } from './data';
import log from '../../lib/methods/helpers/log';

export const useFrequentlyUsedEmoji = (
	withDefaultEmojis = false
): {
	frequentlyUsed: IEmoji[];
	loaded: boolean;
} => {
	const [frequentlyUsed, setFrequentlyUsed] = useState<IEmoji[]>([]);
	const [loaded, setLoaded] = useState(false);
	useEffect(() => {
		const getFrequentlyUsedEmojis = async () => {
			const db = database.active;
			const frequentlyUsedRecords = await db.get('frequently_used_emojis').query().fetch();
			const frequentlyUsedOrdered = orderBy(frequentlyUsedRecords, ['count'], ['desc']);
			let frequentlyUsedEmojis = frequentlyUsedOrdered.map(item => {
				if (item.isCustom) {
					return { name: item.content, extension: item.extension! }; // if isCustom is true, extension is not null
				}
				return item.content;
			});

			// TODO: it might be losing order here because of the concat
			if (withDefaultEmojis) {
				frequentlyUsedEmojis = frequentlyUsedEmojis
					.filter(emoji => {
						if (typeof emoji === 'string') return !DEFAULT_EMOJIS.includes(emoji);
						return !DEFAULT_EMOJIS.includes(emoji.name);
					})
					.concat(DEFAULT_EMOJIS);
			}

			// TODO: remove once we update to React 18
			unstable_batchedUpdates(() => {
				setFrequentlyUsed(frequentlyUsedEmojis);
				setLoaded(true);
			});
		};
		getFrequentlyUsedEmojis();
	}, []);
	return { frequentlyUsed, loaded };
};

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
