import { type TGetCustomEmoji, resolveCustomEmoji } from '../../definitions';
import { useAppSelector } from './useAppSelector';

export const useCustomEmoji = (): TGetCustomEmoji => {
	const customEmojis = useAppSelector(state => state.customEmojis);
	return name => resolveCustomEmoji(customEmojis, name);
};
