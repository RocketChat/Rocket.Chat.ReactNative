import { type ICustomEmojis, type TGetCustomEmoji } from '../../definitions';
import { useAppSelector } from './useAppSelector';

export const resolveCustomEmoji = (customEmojis: ICustomEmojis, name: string) => customEmojis[name] ?? null;

export const useCustomEmoji = (): TGetCustomEmoji => {
	'use memo';

	const customEmojis = useAppSelector(state => state.customEmojis);
	return name => resolveCustomEmoji(customEmojis, name);
};
