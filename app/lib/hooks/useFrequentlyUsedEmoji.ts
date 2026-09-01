import { useEffect, useState } from 'react';

import { type IEmoji } from '../../definitions';
import { getFrequentlyUsedEmojis } from '../methods/emojis';

export interface IUseFrequentlyUsedEmojiResult {
	frequentlyUsed: IEmoji[];
	loaded: boolean;
}

export const useFrequentlyUsedEmoji = (withDefaultEmojis = false): IUseFrequentlyUsedEmojiResult => {
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
