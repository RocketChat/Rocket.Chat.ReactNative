import { useEffect, useState } from 'react';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import database from '../../lib/database';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { IEmoji, TFrequentlyUsedEmojiModel } from '../../definitions';

export const useFrequentlyUsedEmoji = (): {
	frequentlyUsed: (string | IEmoji)[];
	loaded: boolean;
} => {
	const [frequentlyUsed, setFrequentlyUsed] = useState<(string | IEmoji)[]>([]);
	const [loaded, setLoaded] = useState(false);
	const getFrequentlyUsedEmojis = async () => {
		const db = database.active;
		const frequentlyUsedRecords = await db.get('frequently_used_emojis').query().fetch();
		const frequentlyUsedOrdered = orderBy(frequentlyUsedRecords, ['count'], ['desc']);
		const frequentlyUsedEmojis = frequentlyUsedOrdered.map(item => {
			if (item.isCustom) {
				return { content: item.content, extension: item.extension, isCustom: item.isCustom };
			}
			return shortnameToUnicode(`${item.content}`);
		}) as (string | IEmoji)[];
		setFrequentlyUsed(frequentlyUsedEmojis);
		setLoaded(true);
	};
	useEffect(() => {
		getFrequentlyUsedEmojis();
	}, []);
	return { frequentlyUsed, loaded };
};

export const addFrequentlyUsed = async (emoji: IEmoji) => {
	const db = database.active;
	const freqEmojiCollection = db.get('frequently_used_emojis');
	let freqEmojiRecord: TFrequentlyUsedEmojiModel;
	try {
		freqEmojiRecord = await freqEmojiCollection.find(emoji.content || emoji.name);
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
				f._raw = sanitizedRaw({ id: emoji.content || emoji.name }, freqEmojiCollection.schema);
				Object.assign(f, emoji);
				f.count = 1;
			});
		}
	});
};
