import React, { memo } from 'react';
import { FlatList } from 'react-native';

import { ICustomEmojis, IEmoji } from '../../definitions/IEmoji';
import scrollPersistTaps from '../../lib/methods/helpers/scrollPersistTaps';
import { PressableEmoji } from './PressableEmoji';
import { EMOJI_BUTTON_SIZE } from './styles';
import { emojisByCategory } from '../../lib/constants';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { useFrequentlyUsedEmoji } from '../../lib/hooks/useFrequentlyUsedEmoji';

interface IEmojiCategoryProps {
	onEmojiSelected: (emoji: IEmoji) => void;
	parentWidth: number;
	category?: keyof typeof emojisByCategory | 'frequentlyUsed' | 'custom';
	emojis?: IEmoji[];
}

const useEmojis = (category: IEmojiCategoryProps['category']) => {
	const { frequentlyUsed, loaded } = useFrequentlyUsedEmoji();
	const allCustomEmojis: ICustomEmojis = useAppSelector(
		state => state.customEmojis,
		() => true
	);
	if (!category) {
		return [];
	}
	const customEmojis = Object.keys(allCustomEmojis)
		.filter(item => item === allCustomEmojis[item].name)
		.map(item => ({
			name: allCustomEmojis[item].name,
			extension: allCustomEmojis[item].extension
		}));

	if (!loaded) {
		return [];
	}
	if (category === 'frequentlyUsed') {
		return frequentlyUsed;
	}
	if (category === 'custom') {
		return customEmojis;
	}
	return emojisByCategory[category];
};

const EmojiCategory = ({ parentWidth, category, emojis, onEmojiSelected }: IEmojiCategoryProps): React.ReactElement | null => {
	const items = useEmojis(category);

	if (!parentWidth) {
		return null;
	}

	const numColumns = Math.trunc(parentWidth / EMOJI_BUTTON_SIZE);
	const marginHorizontal = (parentWidth % EMOJI_BUTTON_SIZE) / 2;

	const renderItem = ({ item }: { item: IEmoji }) => <PressableEmoji emoji={item} onPress={onEmojiSelected} />;

	return (
		<FlatList
			key={`emoji-category-${parentWidth}`}
			keyExtractor={item => (typeof item === 'string' ? item : item.name)}
			data={emojis || items}
			renderItem={renderItem}
			numColumns={numColumns}
			contentContainerStyle={{ marginHorizontal }}
			{...scrollPersistTaps}
			keyboardDismissMode={'none'}
		/>
	);
};

export default memo(EmojiCategory);
