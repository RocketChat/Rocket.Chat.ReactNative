import { useCallback } from 'react';

import { type TGetCustomEmoji, resolveCustomEmoji } from '~/definitions';
import { useAppSelector } from './useAppSelector';

export const useCustomEmoji = (): TGetCustomEmoji => {
	const customEmojis = useAppSelector(state => state.customEmojis);
	return useCallback(name => resolveCustomEmoji(customEmojis, name), [customEmojis]);
};
