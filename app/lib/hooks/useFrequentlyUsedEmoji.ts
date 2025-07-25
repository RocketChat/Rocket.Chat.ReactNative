import { useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';

import database from '../database';
import { IEmoji } from '../../definitions';
import { DEFAULT_EMOJIS } from '../constants';

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
			const frequentlyUsedRecords = await db.get('frequently_used_emojis').query(Q.sortBy('count', Q.desc)).fetch();
			let frequentlyUsedEmojis = frequentlyUsedRecords.map(item => {
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

			setFrequentlyUsed(frequentlyUsedEmojis);
			setLoaded(true);
		};
		getFrequentlyUsedEmojis();
	}, []);
	return { frequentlyUsed, loaded };
};
