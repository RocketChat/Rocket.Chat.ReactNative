import { useEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-native';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../../lib/database';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { IEmoji, TFrequentlyUsedEmojiModel } from '../../definitions';

export const useFrequentlyUsedEmoji = (): {
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
			const frequentlyUsedEmojis = frequentlyUsedOrdered.map(item => {
				if (item.isCustom) {
					return { content: item.content, extension: item.extension, isCustom: item.isCustom };
				}
				return shortnameToUnicode(`${item.content}`);
			}) as IEmoji[];
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
			freqEmojiRecord = await freqEmojiCollection.find(emoji.content || emoji.name);
		}
	} catch (error) {
		// Do nothing
	}

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
					f._raw = sanitizedRaw({ id: emoji.content || emoji.name }, freqEmojiCollection.schema);
					Object.assign(f, emoji);
				}
				f.count = 1;
			});
		}
	});
};
