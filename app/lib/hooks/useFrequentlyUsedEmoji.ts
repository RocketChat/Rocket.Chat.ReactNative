import { useEffect, useState } from 'react';

import { type IEmoji } from '../../definitions';
import { getFrequentlyUsedEmojis } from '../methods/emojis';

export const useFrequentlyUsedEmoji = (
	withDefaultEmojis = false
): {
	frequentlyUsed: IEmoji[];
	loaded: boolean;
} => {
	const [frequentlyUsed, setFrequentlyUsed] = useState<IEmoji[]>([]);
	const [loaded, setLoaded] = useState(false);
	useEffect(() => {
		const fetchFrequentlyUsedEmojis = async () => {
			const emojis = await getFrequentlyUsedEmojis(withDefaultEmojis);
			setFrequentlyUsed(emojis);
			setLoaded(true);
		};
		fetchFrequentlyUsedEmojis();
	}, [withDefaultEmojis]);
	return { frequentlyUsed, loaded };
};
