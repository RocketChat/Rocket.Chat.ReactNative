import { useEffect, useState } from 'react';
import orderBy from 'lodash/orderBy';

import database from '../../lib/database';
import shortnameToUnicode from '../../lib/methods/helpers/shortnameToUnicode';
import { IEmoji } from '../../definitions';

const useFrequentlyUsedEmoji = (): {
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

export default useFrequentlyUsedEmoji;
